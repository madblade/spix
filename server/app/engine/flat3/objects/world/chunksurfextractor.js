/**
 *
 */

'use strict';

import ChunkLoader from './chunkloader';

class ChunkSurfaceExtractor {

    constructor(chunk) {
        this._chunk = chunk;
        this._neighbors = [];
        this._neighborBlocks = [];

        // Get all six neighbour chunks.
        for (let i = 0; i<4; ++i) {
            this._neighbors.push(ChunkLoader.getNeighboringChunk(chunk, i));
            this._neighborBlocks.push(this._neighbors[i].blocks);
        }
    }

    extractSurfaceBlocks() {
        let chunk = this._chunk;
        const iSize = chunk.dimensions[0];
        const ijSize = chunk.dimensions[0] * chunk.dimensions[1];

        var sbs = chunk.surfaceBlocks;
        function addSurfaceBlock(bid) {
            const ijC = bid % ijSize;
            const z = (bid - ijC) / ijSize;
            if (sbs.hasOwnProperty(z)) sbs[z].push((ijC));
            else sbs[z] = [ijC];
        }

        // Test neighbourhood.
        let blocks = chunk.blocks;
        let length = blocks.length;
        let nBlocks = this._neighborBlocks;
        for (let b = 0; b < length; ++b) {
            if (blocks[b] !== 0) {
                const iPlus = b+1;
                if (iPlus % iSize === 0) {
                    if (blocks[iPlus] === 0) { addSurfaceBlock(b); continue; }
                } else { // Access other chunk
                    if (nBlocks[0][iPlus-iSize] === 0) { addSurfaceBlock(b); continue; }
                }

                const iMinus = b-1;
                if (iMinus % iSize !== iSize-1) {
                    if (blocks[iMinus] === 0) { addSurfaceBlock(b); continue; }
                } else { // Access other chunk
                    if (nBlocks[1][iMinus+iSize]) { addSurfaceBlock(b); continue; }
                }

                const jPlus = b+iSize;
                if ((jPlus-b%iSize) % ijSize !== 0) {
                    if (blocks[jPlus] === 0) { addSurfaceBlock(b); continue; }
                } else { // Access other chunk

                }

                const jMinus = b-iSize;
                if ((jMinus-b%iSize) % ijSize !== ijSize-1) {
                    if ((blocks[jMinus] === 0)) { addSurfaceBlock(b); continue; }
                } else { // Access other chunk

                }

                const kPlus = b+ijSize;
                if (kPlus < length) {
                    if (blocks[kPlus] === 0) {addSurfaceBlock(b); continue;}
                } else { // Access other chunk

                }

                const kMinus = b-ijSize;
                if (kMinus >= 0) {
                    if (blocks[kMinus] === 0) {addSurfaceBlock(b);}
                } else { // Access other chunk

                }

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
        var faces = [new Int32Array(capacity), new Int32Array(capacity), new Int32Array(capacity)];

        var connectedComponents = new Uint8Array(3 * capacity);
        connectedComponents.fill(0);
        var encounteredFaces = new Uint8Array(3 * capacity); // Util for merger.
        encounteredFaces.fill(0);
        let ccid = 1;

        const debug = false;

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

        function setFace(direction, bid) {
            let blockId = bid;
            switch (direction) {
                case 0: blockId -= 1; break;
                case 1: blockId -= iS; break;
                case 2: blockId -= ijS; break;
                default:
            }

            // Set surface face
            const d = direction%3;
            if (d in surfaceFaces) surfaceFaces[d].push(blockId);
            else surfaceFaces[direction%3] = [blockId];

            // Set faces
            faces[d][blockId] = blocks[bid]; // Face nature
            if (direction<3) faces[d][blockId] *= -1; // Face normal (-1 => towards minus)

            // Set connected component
            const faceId = d*capacity + blockId;
            encounteredFaces[faceId] = connectedComponents[faceId] = ccid++;
        }

        // Compute POST borders.
        for (let z in surfaceBlocks) {
            let layer = surfaceBlocks[z];
            for (let b = 0; b < layer.length; ++b) {
                let blockId = layer[b] + z*ijS;
                for (let direction = 0; direction <6; ++direction) {
                    if (inbounds(direction, blockId)) {
                        if (empty(direction, blockId, blocks)) {
                            setFace(direction, blockId);
                        }
                    } else {
                        // let neighbor = chunk.getNeighboringChunk(direction);
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
            if (top < capacity) {
                if (faces[0][top] > 0 && normalP || faces[0][top] < 0 && normalM) {
                    if (debug) console.log("i linked to top i");
                    cc[top] = cc[stackFaceId];
                }
            } // TODO is it inbounds?

            const back = flatFaceId + iS;
            if (back % ijS === (flatFaceId % ijS) + iS){
                if (faces[0][back] > 0 && normalP || faces[0][back] < 0 && normalM) {
                    if (debug) console.log("i linked to back i");
                    cc[back] = cc[stackFaceId];
                }
            } // TODO is it inbounds?

            // CASE 2: orthogonal with CURRENT top and back (j, k)
            const flatTopOrtho = flatFaceId; // k, obviously inbounds POTENTIALLY MERGED
            const stackTopOrtho = 2 * capacity + flatFaceId;
            if (faces[2][flatTopOrtho] > 0 && normalP || faces[2][flatTopOrtho] < 0 && normalM) {
                if (debug) console.log('i linked to current k');
                if (ec[stackTopOrtho] !== cc[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId]) {
                    merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
                }
                cc[stackTopOrtho] = cc[stackFaceId];
            }

            const flatBackOrtho = flatFaceId; // j, obviously inbounds POTENTIALLY MERGED
            const stackBackOrtho = capacity + flatFaceId;
            if (faces[1][flatBackOrtho] > 0 && normalP || faces[1][flatBackOrtho] < 0 && normalM) {
                if (debug) console.log('i linked to current j');
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
                if (faces[2][flatTopOrthoNext] < 0 && normalP || faces[2][flatTopOrthoNext] > 0 && normalM) {
                    if (debug) console.log('i linked to next k');
                    cc[stackTopOrthoNext] = cc[stackFaceId];
                }
            }

            const flatBackOrthoNext = flatBackOrtho + 1; // j
            if (flatBackOrthoNext % iS === (flatBackOrtho % iS) + 1) { // TODO is it inbounds?
                const stackBackOrthoNext = capacity + flatBackOrthoNext;
                if (faces[1][flatBackOrthoNext] < 0 && normalP || faces[1][flatBackOrthoNext] > 0 && normalM) {
                    if (debug) console.log('i linked to next j');
                    cc[stackBackOrthoNext] = cc[stackFaceId];
                }
            }

            // CASE 4: ortho with previous j on next i, regular orientation
            const flatOrthoIJ = flatBackOrthoNext - iS;
            if (flatOrthoIJ > 0) { // TODO is it inbounds?
                const stackOrthoIJ = capacity + flatOrthoIJ;
                if (faces[1][flatOrthoIJ] > 0 && normalP || faces[1][flatOrthoIJ] < 0 && normalM) {
                    if (debug) console.log('i linked to previous j');
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
                if (faces[1][top] > 0 && normalP || faces[1][top] < 0 && normalM) {
                    if (debug) console.log('j linked to top j');
                    cc[stackTop] = cc[stackFaceId];
                }
            }

            const right = flatFaceId + 1; // POTENTIALLY MERGED
            if (right % iS === (flatFaceId % iS) + 1) { // TODO is it inbounds?
                const stackRight = capacity + right;
                if (faces[1][right] > 0 && normalP || faces[1][right] < 0 && normalM) {
                    if (debug) console.log('j linked to back j');
                    if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId]) {
                        merger.push([cc[stackRight], cc[stackFaceId]]);
                    }
                    cc[stackRight] = cc[stackFaceId];
                }
            }

            // CASE 2: orthogonal with top (k)
            const flatTopOrtho = flatFaceId; // k, obviously inbounds, POTENTIALLY MERGED
            const stackTopOrtho = 2*capacity + flatFaceId;
            if (faces[2][flatTopOrtho] > 0 && normalP || faces[2][flatTopOrtho] < 0 && normalM) {
                if (debug) console.log('j linked to current k');
                if (cc[stackTopOrtho] !== ec[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId]) {
                    merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
                }
                cc[stackTopOrtho] = cc[stackFaceId];
            }

            // CASE 3: orthogonal with next k or next i
            // REVERSE ORIENTATION
            const flatTopOrthoNext = flatTopOrtho + iS; // next k, NOT MERGED YET
            if (flatTopOrthoNext % ijS === (flatTopOrtho % ijS) + iS) { // TODO is it inbounds?
                const stackTopOrthoNext = 2*capacity + flatTopOrthoNext;
                if (faces[2][flatTopOrthoNext] < 0 && normalP || faces[2][flatTopOrthoNext] > 0 && normalM) {
                    if (debug) console.log('j linked to next k');
                    cc[stackTopOrthoNext] = cc[stackFaceId];
                }
            }

            const flatBackOrthoNext = flatFaceId + 1; // next i
            if (flatBackOrthoNext % iS === (flatFaceId % iS) + 1) {
                const stackBackOrthoNext = flatFaceId + 1; // TODO refactor
                if (faces[0][flatBackOrthoNext] < 0 && normalP || faces[0][flatBackOrthoNext] > 0 && normalM) {
                    if (debug) console.log('j linked to next i');
                    cc[stackBackOrthoNext] = cc[stackFaceId];
                }
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
                    if (debug) console.log('k linked to right k');
                    if (cc[stackBack] !== ec[stackBack] && cc[stackBack] !== cc[stackFaceId]) {
                        merger.push([cc[stackBack], cc[stackFaceId]]);
                    }
                    cc[stackBack] = cc[stackFaceId];
                }
            }

            const right = flatFaceId + 1;
            if (right % iS === (flatFaceId % iS) + 1) { // is it inbounds?
                const stackRight = 2 * capacity + right;
                if (faces[2][right] > 0 && normalP || faces[2][right] < 0 && normalM) {
                    if (debug) console.log('k linked to back k');
                    if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId]) {
                        merger.push([cc[stackRight], cc[stackFaceId]]);
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
                    if (debug) console.log('k linked to current j');
                    if (cc[stackBackOrtho] !== ec[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId]) {
                        merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
                    }
                    cc[stackBackOrtho] = cc[stackFaceId];
                }
            }

            const flatRightOrthoCurrent = flatFaceId + ijS; // i
            if (flatRightOrthoCurrent < capacity) {
                const stackRightOrthoCurrent = flatRightOrthoCurrent;
                if (faces[0][flatRightOrthoCurrent] < 0 && normalP || faces[0][flatRightOrthoCurrent] > 0 && normalM) {
                    if (debug) console.log('k linked to current i');
                    if (cc[stackRightOrthoCurrent] !== ec[stackRightOrthoCurrent] && cc[stackRightOrthoCurrent]!== cc[stackFaceId]) {
                        merger.push([cc[stackRightOrthoCurrent], cc[stackFaceId]]);
                    }
                    cc[stackRightOrthoCurrent] = cc[stackFaceId];
                }
            }

            // Previous -> regular orientation
            const flatBackOrthoPrevious = flatBackOrthoCurrent - iS; // j
            if (flatBackOrthoPrevious < capacity && (flatBackOrthoPrevious % ijS === (flatBackOrthoCurrent % ijS) - iS)) {
                const stackBackOrthoPrevious = capacity + flatBackOrthoPrevious;
                if (faces[1][flatBackOrthoPrevious] > 0 && normalP || faces[1][flatBackOrthoPrevious] < 0 && normalM) {
                    if (debug) console.log('k linked to previous j');
                    if (cc[stackBackOrthoPrevious] !== ec[stackBackOrthoPrevious] && cc[stackBackOrthoPrevious] !== cc[stackFaceId]) {
                        merger.push([cc[stackBackOrthoPrevious], cc[stackFaceId]]);
                    }
                    cc[stackBackOrthoPrevious] = cc[stackFaceId];
                }
            }

            const flatRightOrthoPrevious = flatRightOrthoCurrent - 1; // i
            if (flatRightOrthoPrevious < capacity && (flatRightOrthoPrevious % iS === (flatRightOrthoCurrent % iS) - 1)) {
                const stackRightOrthoPrevious = flatRightOrthoPrevious;
                if (faces[0][flatRightOrthoPrevious] > 0 && normalP || faces[0][flatRightOrthoPrevious] < 0 && normalM) {
                    if (debug) console.log('k linked to previous i');
                    if (cc[stackRightOrthoPrevious] !== ec[stackRightOrthoPrevious] && cc[stackRightOrthoPrevious] !== cc[stackFaceId]) {
                        merger.push([cc[stackRightOrthoPrevious], cc[stackFaceId]]);
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

        jays.sort();
        kays.sort();

        let currentBlock = capacity;
        if (ayesLength > 0) currentBlock = ayes[ayeCurrent];
        if (jaysLength > 0) currentBlock = Math.min(currentBlock, jays[jayCurrent]);
        if (kaysLength > 0) currentBlock = Math.min(currentBlock, kays[kayCurrent]);

        while ((ayeCurrent < ayesLength || jayCurrent < jaysLength || kayCurrent < kaysLength) && currentBlock < capacity) {
            if (ayes[ayeCurrent] === currentBlock) aye(ayes[ayeCurrent++]);
            if (jays[jayCurrent] === currentBlock) jay(jays[jayCurrent++]);
            if (kays[kayCurrent] === currentBlock) kay(kays[kayCurrent++]);
            ++currentBlock;
        }

        if (kayCurrent !== kaysLength) console.log("WARN. kays not recursed: " + kayCurrent + " out of " + kaysLength);
        if (jayCurrent !== jaysLength) console.log("WARN. jays not recursed: " + jayCurrent + " out of " + jaysLength);
        if (ayeCurrent !== ayesLength) console.log("WARN. ayes not recursed: " + ayeCurrent + " out of " + ayesLength);

        // Compute fast connected components.
        var fastCC = {};
        for (let i = 0; i < connectedComponents.length; ++i) {
            if (connectedComponents[i] === 0) continue;
            if (!fastCC.hasOwnProperty(connectedComponents[i]))
                fastCC[connectedComponents[i]] = [i];
            else fastCC[connectedComponents[i]].push(i);
        }

        // PostMerge.
        function mergeArrays(a, b) {
            var result = a;
            for (let i = 0; i<b.length; ++i) {
                if (a.indexOf(b[i]) < 0) a.push(b[i]);
            }
            return result;
        }

        var fastMerger = [];
        if (merger.length > 0) fastMerger.push([merger[0][0], merger[0][1]]);
        for (let c = 1; c < merger.length; ++c) {
            let min = Math.min(merger[c][0], merger[c][1]);
            let max = Math.max(merger[c][0], merger[c][1]);

            let minFound = -1;
            let maxFound = -1;
            for (let d = 0; d < fastMerger.length; ++d) {
                if (fastMerger[d].indexOf(min) >= 0) {
                    minFound = d;
                }
                if (fastMerger[d].indexOf(max) >= 0) {
                    maxFound = d;
                }

                if (minFound !== -1 && maxFound !== -1) break;
            }

            // Merge arrays
            if (minFound >= 0 && maxFound >= 0 && minFound !== maxFound) {
                fastMerger[minFound] = mergeArrays(fastMerger[minFound], fastMerger[maxFound]);
                fastMerger.splice(maxFound, 1);
            }
            else if (minFound >= 0 && maxFound < 0) {
                if (fastMerger[minFound].indexOf(max) < 0) {
                    fastMerger[minFound].push(max);
                }
            }
            else if (maxFound >= 0 && minFound < 0) {
                if (fastMerger[maxFound].indexOf(min) < 0) {
                    fastMerger[maxFound].push(min);
                }
            }
            else if (minFound < 0 && maxFound < 0) {
                fastMerger.push([min, max]);
            }
        }

        for (let k = 0; k < fastMerger.length; ++k) {
            let id = fastMerger[k][0];
            if (!fastCC.hasOwnProperty(id)) {
                console.log('PostMerger failed because of id inconsistency.');
                continue;
            }
            let componentsToMerge = fastMerger[k];

            for (let i=1; i<componentsToMerge.length; ++i) {
                let toMerge = componentsToMerge[i];
                let ccToMerge = fastCC[toMerge];

                // Merge: update connected components
                for (let j = 0; j<ccToMerge.length; ++j) {
                    connectedComponents[ccToMerge[j]] = id;
                }

                // Merge: update fast components
                for (let ffid = 0; ffid < ccToMerge.length; ++ffid) {
                    fastCC[id].push(ccToMerge[ffid]);
                }
                delete fastCC[toMerge];
            }
        }

        // TODO check fastCC...
        for (let i in fastCC) {
            for (let faceId = 0; faceId < fastCC[i].length; ++faceId) {
                if (fastCC[i].indexOf(fastCC[i][faceId]) !== faceId) console.log("Detected duplicate face.");
            }
        }

        // Induce Ids.
        var fastCCIds = {};
        for (let cccid in fastCC) {
            fastCCIds[cccid] = [];
            let tcur = fastCCIds[cccid];
            let fcc = fastCC[cccid];
            fcc.sort();
            for (let i in fcc) {
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
