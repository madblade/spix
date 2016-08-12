/**
 *
 */

'use strict';

import ChunkLoader from './../chunkloader';

class CSFX {

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

    static inbounds(d, b, iS, ijS, capacity) {
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

    static empty(d, b, bs, iS, ijS) {
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

    static setFace(direction, bid, blocks, faces,
                   surfaceFaces, encounteredFaces, connectedComponents,
                   capacity, iS, ijS, ccid)
    {
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
        encounteredFaces[faceId] = connectedComponents[faceId] = ccid;
    }

    static extractRawFaces(blocks, surfaceBlocks, faces, surfaceFaces, encounteredFaces, connectedComponents, iS, ijS, capacity) {
        let ccid = 1;
        for (let z in surfaceBlocks) {
            let layer = surfaceBlocks[z];
            for (let b = 0; b < layer.length; ++b) {
                let blockId = layer[b] + z*ijS;
                for (let direction = 0; direction <6; ++direction) {
                    if (CSFX.inbounds(direction, blockId, iS, ijS, capacity)) {
                        if (CSFX.empty(direction, blockId, blocks, iS, ijS)) {

                            CSFX.setFace(direction, blockId, blocks, faces,
                                surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid);

                            ccid++;
                        }
                    } else {
                        //let neighbor = chunk.getNeighboringChunk(direction);
                        // TODO access other chunk.
                    }
                }
            }
        }
    }

    static linkI(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS) {
        const debug = false;

        // Working with flat indices (3 arrays of length 'capacity')
        // Working with stacked indices (1 array with [0,capacity[=i, [capacity,2capacity[=j, ...)
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

    static linkJ(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS) {
        const debug = false;

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

    static linkK(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS) {
        const debug = false;

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

    static preMerge(surfaceFaces, connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS) {

        let ayes = surfaceFaces['0'];
        let jays = surfaceFaces['1'];
        let kays = surfaceFaces['2'];

        let ayesLength = ayes.length;
        let jaysLength = jays.length;
        let kaysLength = kays.length;

        let ayeCurrent = 0;
        let jayCurrent = 0;
        let kayCurrent = 0;

        jays.sort();
        kays.sort();

        let currentBlock = capacity;
        if (ayesLength > 0) currentBlock = ayes[ayeCurrent];
        if (jaysLength > 0) currentBlock = Math.min(currentBlock, jays[jayCurrent]);
        if (kaysLength > 0) currentBlock = Math.min(currentBlock, kays[kayCurrent]);

        while ((ayeCurrent<ayesLength || jayCurrent<jaysLength || kayCurrent<kaysLength) && currentBlock<capacity) {

            if (ayes[ayeCurrent] === currentBlock)
                CSFX.linkI(ayes[ayeCurrent++], connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS);

            if (jays[jayCurrent] === currentBlock)
                CSFX.linkJ(jays[jayCurrent++], connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS);

            if (kays[kayCurrent] === currentBlock)
                CSFX.linkK(kays[kayCurrent++], connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS);

            ++currentBlock;
        }

        if (kayCurrent !== kaysLength) console.log("WARN. kays not recursed: " + kayCurrent + " out of " + kaysLength);
        if (jayCurrent !== jaysLength) console.log("WARN. jays not recursed: " + jayCurrent + " out of " + jaysLength);
        if (ayeCurrent !== ayesLength) console.log("WARN. ayes not recursed: " + ayeCurrent + " out of " + ayesLength);
    }

    static precomputeFastConnectedComponents(connectedComponents, fastCC) {
        for (let i = 0, length = connectedComponents.length; i < length; ++i) {
            if (connectedComponents[i] === 0) continue;
            if (!fastCC.hasOwnProperty(connectedComponents[i]))
                fastCC[connectedComponents[i]] = [i];
            else fastCC[connectedComponents[i]].push(i);
        }
    }

    static postMerge(merger, fastCC, connectedComponents) {
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
                if (fastMerger[d].indexOf(min) >= 0) minFound = d;
                if (fastMerger[d].indexOf(max) >= 0) maxFound = d;
                if (minFound !== -1 && maxFound !== -1) break;
            }

            // Merge arrays
            if (minFound >= 0 && maxFound >= 0 && minFound !== maxFound) {
                fastMerger[minFound] = mergeArrays(fastMerger[minFound], fastMerger[maxFound]);
                fastMerger.splice(maxFound, 1);
            }
            else if (minFound >= 0 && maxFound < 0) {
                if (fastMerger[minFound].indexOf(max) < 0) fastMerger[minFound].push(max);
            }
            else if (maxFound >= 0 && minFound < 0) {
                if (fastMerger[maxFound].indexOf(min) < 0) fastMerger[maxFound].push(min);
            }
            else if (minFound < 0 && maxFound < 0) {
                fastMerger.push([min, max]);
            }
        }

        for (let k = 0, fmLength = fastMerger.length; k < fmLength; ++k) {
            let id = fastMerger[k][0];
            if (!fastCC.hasOwnProperty(id)) {
                console.log('PostMerger failed because of id inconsistency.');
                continue;
            }
            let componentsToMerge = fastMerger[k];

            for (let i = 1, ctmLength = componentsToMerge.length; i < ctmLength; ++i) {
                let toMerge = componentsToMerge[i];
                let ccToMerge = fastCC[toMerge];

                // Merge: update connected components
                for (let j = 0, cctmLength = ccToMerge.length; j < cctmLength; ++j)
                    connectedComponents[ccToMerge[j]] = id;

                // Merge: update fast components
                for (let j = 0, cctmLength = ccToMerge.length; j < cctmLength; ++j)
                    fastCC[id].push(ccToMerge[j]);

                delete fastCC[toMerge];
            }
        }
    }

    static computeFastConnectedComponentIds(fastCC, fastCCIds, capacity, faces) {
        for (let cccid in fastCC) {
            fastCCIds[cccid] = [];
            let tcur = fastCCIds[cccid];
            let fcc = fastCC[cccid];
            fcc.sort();
            for (let i in fcc) {
                let j = fcc[i];
                let orientation = j < capacity ? 0 : j < 2 * capacity ? 1 : 2;
                let realId = j % capacity;
                tcur.push(faces[orientation][realId]);
            }
        }
    }

    extractConnectedComponents() {
        // Properties
        let chunk = this._chunk;
        var surfaceBlocks = chunk.surfaceBlocks;
        var blocks = chunk.blocks;

        // Static properties
        const iS = chunk.dimensions[0];
        const ijS = chunk.dimensions[0] * chunk.dimensions[1];
        const capacity = blocks.length;

        // Temporary variables
        var surfaceFaces = {'0':[],'1':[],'2':[]};
        var faces = [new Int32Array(capacity), new Int32Array(capacity), new Int32Array(capacity)];
        var encounteredFaces = new Uint8Array(3 * capacity); // initializes all to 0

        // Results
        var connectedComponents = new Uint8Array(3 * capacity); // ditto
        var fastCC = {};
        var fastCCIds = {};

        // Compute raw faces.
        CSFX.extractRawFaces(blocks, surfaceBlocks, faces, surfaceFaces, encounteredFaces, connectedComponents, iS, ijS, capacity);

        // Post merger.
        let merger = [];

        // Triple PreMerge.
        CSFX.preMerge(surfaceFaces, connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS);

        // Compute fast connected components.
        CSFX.precomputeFastConnectedComponents(connectedComponents, fastCC);

        // PostMerge.
        CSFX.postMerge(merger, fastCC, connectedComponents);

        // TODO check fastCC...
        for (let i in fastCC) {
            for (let faceId = 0; faceId < fastCC[i].length; ++faceId) {
                if (fastCC[i].indexOf(fastCC[i][faceId]) !== faceId) console.log("Detected duplicate face.");
            }
        }

        // Induce Ids.
        CSFX.computeFastConnectedComponentIds(fastCC, fastCCIds, capacity, faces);

        // Assign
        chunk.fastComponents = fastCC;
        chunk.fastComponentsIds = fastCCIds;
        chunk.connectedComponents = connectedComponents;
    }

}

export default CSFX;
