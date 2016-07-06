/**
 *
 */

'use strict';

class ChunkSurfaceExtractor {
    constructor(chunk) {
        this._chunk = chunk;
    }

    extractSurfaceBlocks() {
        let chunk = this._chunk;
        const iS = chunk.dimensions[0];
        const ijS = chunk.dimensions[0] * chunk.dimensions[1];

        var sbs = chunk.surfaceBlocks;
        function addSurfaceBlock(bid) {
            const ijC = bid % ijS;
            const z = (bid - ijC) / ijS;
            if (sbs.hasOwnProperty(z)) sbs[z].push((ijC));
            else sbs[z] = [ijC];
        }

        // Test neighbourhood.
        let bs = chunk.blocks;
        let length = bs.length;
        for (let b = 0; b < length; ++b) {
            if (bs[b] !== 0) {
                const iP = b+1;
                if ((iP % iS !== 0) && (bs[iP] === 0)) {addSurfaceBlock(b); continue;}
                const iM = b-1;
                if ((iM % iS !== iS-1) && (bs[iM] === 0)) {addSurfaceBlock(b); continue;}

                const jP = b+iS;
                if (((jP-b%iS) % ijS !== 0) && (bs[jP] === 0)) {addSurfaceBlock(b); continue;}
                const jM = b-iS;
                if (((jM-b%iS) % ijS !== ijS-1) && (bs[jM] === 0)) {addSurfaceBlock(b); continue;}

                const kP = b+ijS;
                if (kP < length && bs[kP] === 0) {addSurfaceBlock(b); continue;}
                const kM = b-ijS;
                if (kM >= 0 && bs[kM] === 0) {addSurfaceBlock(b);}
            }
        }
    }

    extractConnectedComponents() {
        let chunk = this._chunk;
        var surfaceBlocks = chunk.surfaceBlocks;
        var blocks = chunk.blocks;

        const iS = chunk.dimensions[0];
        const ijS = chunk.dimensions[0] * chunk.dimensions[1];
        const capacity = blocks.length;

        var surfaceFaces = {'0':[],'1':[],'2':[]};
        var faces = [new Int8Array(capacity), new Int8Array(capacity), new Int8Array(capacity)];

        var connectedComponents = new Uint8Array(3 * capacity);
        connectedComponents.fill(0);
        var encounteredFaces = new Uint8Array(3 * capacity); // Util for merger.
        encounteredFaces.fill(0);
        let ccid = 1;
        var fastConnectedComponents = [];

        // Surface face extraction functions.
        function inbounds(d, b) {
            switch (d) {
                case 0: return (b-1) % iS !== iS-1; // iM
                case 1: return (b-iS-(b%iS)) % ijS !== ijS-1; // jM
                case 2: return (b-ijS) >= 0; // kM
                case 3: return (b+1) % iS !== 0; // iP
                case 4: return (b+iS-(b%iS)) % ijS !== 0; // jP
                case 5: return b+ijS < capacity; // kP
                default: return false;
            }
        }

        function empty(d, b, bs) {
            switch (d) {
                case 0: return bs[b-1] === 0; // iM
                case 1: return bs[(b-iS)] === 0; // jM
                case 2: return bs[b-ijS] === 0; // kM
                case 3: return bs[b+1] === 0; // iP
                case 4: return bs[b+iS] === 0; // jP
                case 5: return bs[b+ijS] === 0; // kP
                default: return false;
            }
        }

        function setFace(direction, blockId) {
            // Set surface face
            const d = direction%3;
            if (d in surfaceFaces) surfaceFaces[d].push(blockId);
            else surfaceFaces[direction%3] = [blockId];

            // Set faces
            faces[d][blockId] = blocks[blockId]; // Face nature
            faces[d][blockId] *= (d%2 === 0 ? 1 : -1); // Face normal (-1 => towards minus)

            // Set connected component
            const faceId = d*capacity + blockId;
            encounteredFaces[faceId] = connectedComponents[faceId] = ccid++;
            // console.log(ccid + " fid " + faceId + " dim " + d);
        }

        // Compute POST borders.
        for (let z in surfaceBlocks) {
            if (!surfaceBlocks.hasOwnProperty(z)) continue;
            let layer = surfaceBlocks[z];
            for (let b = 0; b < layer.length; ++b) {
                let blockId = layer[b] + z*ijS;
                for (let direction = 0; direction <6; ++direction) {
                    if (inbounds(direction, blockId)) {
                        if (empty(direction, blockId, blocks)) {
                            setFace(direction, blockId);
                        }
                    } else {
                        // TODO access other chunk.
                    }
                }
            }
        }

        // Triple PreMerge functions.
        var merger = []; // Post merger.
        function aye(flatFaceId) {
            // Working with flat indices (3 arrays of length 'capacity')
            // Working with stacked indices (1 array with [0,capacity[=i, [capacity,2capacity[=j, ...)
            var cc = connectedComponents;
            var ec = encounteredFaces;
            const stackFaceId = flatFaceId;
            const normalP = faces[0][flatFaceId] > 0;
            const normalM = faces[0][flatFaceId] < 0;

            // CASE 1: aligned with top and back i (both normals)
            const top = flatFaceId + ijS;
            if (top < capacity) // TODO is it inbounds?
                if (faces[0][top] > 0 && normalP || faces[0][top] < 0 && normalM) cc[top] = cc[stackFaceId];

            const back = flatFaceId + iS;
            if (back % ijS === (flatFaceId % ijS) + iS) // TODO is it inbounds?
                if (faces[0][back] > 0 && normalP || faces[0][back] < 0 && normalM) cc[back] = cc[stackFaceId];

            // CASE 2: orthogonal with CURRENT top and back (j, k)
            const flatTopOrtho = flatFaceId; // k, obviously inbounds POTENTIALLY MERGED
            const stackTopOrtho = 2 * capacity + flatFaceId;
            if (faces[2][flatTopOrtho] > 0 && normalP || faces[2][flatTopOrtho] < 0 && normalM) {
                if (ec[stackTopOrtho] !== cc[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId]) {
                    merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
                }
                cc[stackTopOrtho] = cc[stackFaceId];
            }

            const flatBackOrtho = flatFaceId; // j, obviously inbounds POTENTIALLY MERGED
            const stackBackOrtho = capacity + flatFaceId;
            if (faces[1][flatBackOrtho] > 0 && normalP || faces[1][flatBackOrtho] < 0 && normalM) {
                if (ec[stackBackOrtho] !== cc[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId]) {
                    merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
                }
                cc[stackBackOrtho] = cc[stackFaceId];
            }

            // CASE 3: orthogonal with next top and back (j, k)
            // !!! REVERSE NORMALS !!!
            const flatTopOrthoNext = flatTopOrtho + 1; // k
            if (flatTopOrthoNext % iS === (flatTopOrtho % iS) + 1) { // TODO is it inbounds?
                const stackTopOrthoNext = 2 * capacity + flatTopOrthoNext;
                if (faces[2][flatTopOrthoNext] < 0 && normalP || faces[2][flatTopOrthoNext] > 0 && normalM) cc[stackTopOrthoNext] = cc[stackFaceId];
            }

            const flatBackOrthoNext = flatBackOrtho + 1; // j
            if (flatBackOrthoNext % iS === (flatBackOrtho % iS) + 1) { // TODO is it inbounds?
                const stackBackOrthoNext = capacity + flatBackOrthoNext;
                if (faces[1][flatBackOrthoNext] < 0 && normalP || faces[1][flatBackOrthoNext] > 0 && normalM) cc[stackBackOrthoNext] = cc[stackFaceId];
            }

            // CASE 4: ortho with previous j on next i, regular orientation
            const flatOrthoIJ = flatBackOrthoNext - iS;
            if (flatOrthoIJ > 0) { // TODO is it inbounds?
                const stackOrthoIJ = capacity + flatOrthoIJ;
                if (faces[1][flatOrthoIJ] > 0 && normalP || faces[1][flatOrthoIJ] < 0 && normalM) {
                    if (ec[stackOrthoIJ] !== cc[stackOrthoIJ] && cc[stackOrthoIJ] !== cc[stackFaceId]) {
                        merger.push([cc[stackOrthoIJ], cc[stackFaceId]]);
                    }
                    cc[stackOrthoIJ] = cc[stackFaceId];
                }
            }
        }
        function jay(flatFaceId) {
            var cc = connectedComponents;
            var ec = encounteredFaces;
            const stackFaceId = capacity + flatFaceId;
            const normalP = faces[1][flatFaceId] > 0;
            const normalM = faces[1][flatFaceId] < 0;

            // CASE 1: aligned with top and right j
            const top = flatFaceId + ijS; // NOT MERGED YET
            if (top < capacity) { // TODO is it inbounds?
                const stackTop = 2*capacity + top;
                if (faces[1][top] > 0 && normalP || faces[1][top] < 0 && normalM) cc[stackTop] = cc[stackFaceId];
            }
            const right = flatFaceId + 1; // POTENTIALLY MERGED
            if (right % iS === (flatFaceId % iS) + 1) { // TODO is it inbounds?
                const stackRight = capacity + right;
                if (faces[1][right] > 0 && normalP || faces[1][right] < 0 && normalM) {
                    if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId]) {
                        merger.push(cc[stackRight], cc[stackFaceId]);
                    }
                    cc[stackRight] = cc[stackFaceId];
                }
            }

            // CASE 2: orthogonal with top (k)
            const flatTopOrtho = flatFaceId; // k, obviously inbounds, POTENTIALLY MERGED
            const stackTopOrtho = 2*capacity + flatFaceId;
            if (faces[2][flatTopOrtho] > 0 && normalP || faces[2][flatTopOrtho] < 0 && normalM) {
                if (cc[stackTopOrtho] !== ec[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId]) {
                    merger.push(cc[stackTopOrtho], cc[stackFaceId]);
                }
                cc[stackTopOrtho] = cc[stackFaceId];
            }

            // CASE 3: orthogonal with next k or next i
            // REVERSE ORIENTATION
            const flatTopOrthoNext = flatTopOrtho + iS; // next k, NOT MERGED YET
            if (flatTopOrthoNext % ijS === (flatTopOrtho % ijS) + iS) { // TODO is it inbounds?
                const stackTopOrthoNext = 2*capacity + flatTopOrthoNext;
                if (faces[2][flatTopOrthoNext] < 0 && normalP || faces[2][flatTopOrthoNext] > 0 && normalM) cc[stackTopOrthoNext] = cc[stackFaceId];
            }
            const flatBackOrthoNext = flatFaceId + 1; // next i
            if (flatBackOrthoNext % iS === (flatFaceId % iS) + 1) {
                const stackBackOrthoNext = flatFaceId + 1; // TODO refactor
                if (faces[0][flatBackOrthoNext] < 0 && normalP || faces[0][flatBackOrthoNext] > 0 && normalM) cc[stackBackOrthoNext] = cc[stackFaceId];
            }
        }
        function kay(flatFaceId) {
            var cc = connectedComponents;
            var ec = encounteredFaces;
            const normalP = faces[2][flatFaceId] > 0;
            const normalM = faces[2][flatFaceId] < 0;
            const stackFaceId = 2*capacity + flatFaceId;

            // CASE 1: aligned with back and right k
            const back = flatFaceId + iS;
            if (back % ijS === (flatFaceId % ijS) + iS) { // TODO is it inbounds?
                const stackBack = 2 * capacity + back;
                if (faces[2][back] > 0 && normalP || faces[2][back] < 0 && normalM) {
                    if (cc[stackBack] !== ec[stackBack] && cc[stackBack] !== cc[stackFaceId]) {
                        merger.push(cc[stackBack], cc[stackFaceId]);
                    }
                    cc[stackBack] = cc[stackFaceId];
                }
            }
            const right = flatFaceId + 1;
            if (right % iS === (flatFaceId % iS) + 1) { // is it inbounds?
                const stackRight = 2 * capacity + right;
                if (faces[2][right] > 0 && normalP || faces[2][right] < 0 && normalM) {
                    if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId]) {
                        merger.push(cc[stackRight], cc[stackFaceId]);
                    }
                    cc[stackRight] = cc[stackFaceId];
                }
            }

            // CASE 2: orthogonal with (upper current and previous) back and right (j, i)
            // Current -> reverse orientation
            const flatBackOrthoCurrent = flatFaceId + ijS; // j
            if (flatBackOrthoCurrent < capacity) { // TODO is it inbounds?
                const stackBackOrtho = capacity + flatBackOrthoCurrent;
                if (faces[1][flatBackOrthoCurrent] < 0 && normalP || faces[1][flatBackOrthoCurrent] > 0 && normalM) {
                    if (cc[stackBackOrtho] !== ec[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId]) {
                        merger.push(cc[stackBackOrtho], cc[stackFaceId]);
                    }
                    cc[stackBackOrtho] = cc[stackFaceId];
                }
            }
            const flatRightOrthoCurrent = flatFaceId + ijS; // i
            if (flatRightOrthoCurrent < capacity) {
                const stackRightOrthoCurrent = flatFaceId + ijS;
                if (faces[0][flatRightOrthoCurrent] < 0 && normalP || faces[0][flatRightOrthoCurrent] > 0 && normalM) {
                    if (cc[stackRightOrthoCurrent] !== ec[stackRightOrthoCurrent] && cc[stackRightOrthoCurrent]!== cc[stackFaceId]) {
                        merger.push(cc[stackRightOrthoCurrent], cc[stackFaceId]);
                    }
                    cc[stackRightOrthoCurrent] = cc[stackFaceId];
                }
            }

            // Previous -> regular orientation
            const flatBackOrthoPrevious = flatBackOrthoCurrent - iS; // j
            if (flatBackOrthoPrevious < capacity && (flatBackOrthoPrevious % ijS === (flatBackOrthoCurrent % ijS) - iS)) {
                const stackBackOrthoPrevious = capacity + flatBackOrthoPrevious;
                if (faces[1][flatBackOrthoPrevious] > 0 && normalP || faces[1][flatBackOrthoPrevious] < 0 && normalM) {
                    if (cc[stackBackOrthoPrevious] !== ec[stackBackOrthoPrevious] && cc[stackBackOrthoPrevious] !== cc[stackFaceId]) {
                        merger.push(cc[stackBackOrthoPrevious], cc[stackFaceId]);
                    }
                    cc[stackBackOrthoPrevious] = cc[stackFaceId];
                }
            }
            const flatRightOrthoPrevious = flatRightOrthoCurrent - 1; // j
            if (flatRightOrthoPrevious < capacity && (flatRightOrthoPrevious % iS === (flatRightOrthoCurrent % iS) - 1)) {
                const stackRightOrthoPrevious = capacity + flatRightOrthoPrevious;
                if (faces[0][flatRightOrthoPrevious] > 0 && normalP || faces[0][flatRightOrthoPrevious] < 0 && normalM) {
                    if (cc[stackRightOrthoPrevious] !== ec[stackRightOrthoPrevious] && cc[stackRightOrthoPrevious] !== cc[stackFaceId]) {
                        merger.push(cc[stackRightOrthoPrevious], cc[stackFaceId]);
                    }
                    cc[stackRightOrthoPrevious] = cc[stackFaceId];
                }
            }
        }

        // Do PreMerge.
        let ayes = surfaceFaces['0']; let ayesLength = ayes.length;
        let jays = surfaceFaces['1']; let jaysLength = jays.length;
        let kays = surfaceFaces['2']; let kaysLength = kays.length;
        let ayeCurrent = 0; let jayCurrent = 0; let kayCurrent = 0;

        let currentBlock = capacity;
        if (ayesLength > 0) currentBlock = ayes[ayeCurrent];
        if (jaysLength > 0) currentBlock = Math.min(currentBlock, jays[jayCurrent]);
        if (kaysLength > 0) currentBlock = Math.min(currentBlock, kays[kayCurrent]);

        console.log("i " + ayesLength + " j " + jaysLength + " k " + kaysLength);
        while ((ayeCurrent < ayesLength || jayCurrent < jaysLength || kayCurrent < kaysLength) && currentBlock < capacity) {
            if (ayes[ayeCurrent] === currentBlock) aye(ayes[ayeCurrent++]);
            if (jays[jayCurrent] === currentBlock) jay(jays[jayCurrent++]);
            if (kays[kayCurrent] === currentBlock) kay(kays[kayCurrent++]);
            ++currentBlock;
        }
        if (kayCurrent !== kaysLength) console.log("warn. kays not completely recursed");
        if (jayCurrent !== jaysLength) console.log("warn. jays not completely recursed");
        if (ayeCurrent !== ayesLength) console.log("warn. ayes not completely recursed");

        // console.log(merger);

        // Compute fast connected components.
        var fastCC = {};
        for (let i = 0; i < connectedComponents.length; ++i) {
            if (connectedComponents[i] === 0) continue;
            if (!fastCC.hasOwnProperty(connectedComponents[i]))
                fastCC[connectedComponents[i]] = [i];
            else fastCC[connectedComponents[i]].push(i);
        }

        // PostMerge.
        var fastMerger = {};
        for (let c = 0; c<merger.length; ++c) {
            let min = Math.min(merger[c][0], merger[c][1]);
            let max = Math.max(merger[c][0], merger[c][1]);
            if (!fastMerger.hasOwnProperty(max)) fastMerger[max] = min;
            else if (min < fastMerger[max]) fastMerger[max] = min;
        }
        for (let id in fastCC) {
            if (!fastCC.hasOwnProperty(id)) continue;
            let cc = fastCC[id];
            if (fastMerger.hasOwnProperty(id)) {
                let minCC = fastMerger[id];
                // Merge: update connected components
                for (let i = 0; i<cc.length; ++i) {
                    connectedComponents[cc[i]] = minCC;
                }
                // Merge: update fast components
                fastCC[minCC] = fastCC[minCC].concat(fastCC[id]);
                delete fastCC[id];
            }
        }

        // Induce Ids.
        var fastCCIds = {};
        for (let cccid in fastCC) {
            if (!fastCC.hasOwnProperty(cccid)) continue;
            fastCCIds[cccid] = [];
            let tcur = fastCCIds[cccid];
            let fcc = fastCC[cccid];
            for (let i in fcc) {
                if (!fcc.hasOwnProperty(i)) continue;
                let j = fcc[i];
                let orientation = j < capacity ? 0 : j < 2*capacity ? 1 : 2;
                let realId = j % capacity;
                tcur.push(faces[orientation][realId]);
            }
        }

        // Assign
        chunk.fastComponents = fastCC;
        chunk.fastComponentsIds = fastCCIds;
        chunk.connectedComponents = connectedComponents;
    }

}

export default ChunkSurfaceExtractor;
