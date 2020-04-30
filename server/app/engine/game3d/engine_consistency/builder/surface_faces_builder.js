/**
 *
 */

'use strict';

import ChunkBuilder from './builder_chunks';
import FaceLinker   from './surface_faces_linker';
import { BlockType } from '../../model_world/model';

class CSFX
{
    /**
     * @deprecated
     */
    static forceOneComponentPerChunk = false; // Lazy, inefficient in terms of i/o

    static debug = false;
    static debugIJKRecursion = false;
    static debugLinks = false;
    static debugFastCC = false;
    static debugPostMerger = false;

    static inbounds(d, b, iS, ijS, capacity) {
        switch (d) {
            case 0: return (b - 1) % iS === b % iS - 1; // iM
            case 1: return (b - iS) % ijS === b % ijS - iS; // jM
            case 2: return b - ijS >= 0; // kM
            case 3: return (b + 1) % iS !== 0; // iP
            case 4: return (b + iS - b % iS) % ijS !== 0; // jP
            case 5: return b + ijS < capacity; // kP
            default: return false;
        }
    }

    static empty(d, b, bs, iS, ijS) {
        switch (d) {
            case 0: return bs[b - 1] === 0; // iM
            case 1: return bs[b - iS] === 0; // jM
            case 2: return bs[b - ijS] === 0; // kM
            case 3: return bs[b + 1] === 0; // iP
            case 4: return bs[b + iS] === 0; // jP
            case 5: return bs[b + ijS] === 0; // kP
            default: return false;
        }
    }

    static hasNeighbourOfType(d, b, bs, iS, ijS, blockType) {
        switch (d) {
            case 0: return bs[b - 1] === blockType; // iM
            case 1: return bs[b - iS] === blockType; // jM
            case 2: return bs[b - ijS] === blockType; // kM
            case 3: return bs[b + 1] === blockType; // iP
            case 4: return bs[b + iS] === blockType; // jP
            case 5: return bs[b + ijS] === blockType; // kP
            default: return false;
        }
    }

    static setFace(
        direction, bid, blockNature, faces,
        surfaceFaces, encounteredFaces, connectedComponents,
        capacity, iS, ijS, ccid, dontTranslate)
    {
        let blockId = bid;
        if (!dontTranslate) { // Boundary faces with reverted normals.
            switch (direction) {
                case 0: blockId -= 1; break;
                case 1: blockId -= iS; break;
                case 2: blockId -= ijS; break;
                default:
            }
        }

        // Set surface face
        const d = direction % 3;
        if (d in surfaceFaces) surfaceFaces[d].push(blockId);
        else surfaceFaces[d] = [blockId];

        // Set faces
        const factor = direction < 3 ? -1 : 1; // Face normal (-1 => towards minus)
        faces[d][blockId] = factor * blockNature; // Face nature

        // Set connected component
        const faceId = d * capacity + blockId;
        encounteredFaces[faceId] = ccid;
        connectedComponents[faceId] = ccid;
    }

    static extractRawFacesPerLayer(
        z, layer,
        iS, jS, kS, ijS, capacity,
        nbX, nbY, nbZ,
        blocks, faces, surfaceFaces, encounteredFaces, connectedComponents
    )
    {
        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;
        // !air-air => ccid = 1
        // !water-water => ccid = 2

        for (let b = 0, length = layer.length; b < length; ++b) {
            let offset = z * ijS;
            let idOnCurrentLayer = layer[b];

            let blockId = idOnCurrentLayer + offset;
            const block = blocks[blockId];

            for (let direction = 0; direction < 6; ++direction) {
                if (CSFX.inbounds(direction, blockId, iS, ijS, capacity)) {
                    if (block !== airBlock && CSFX.hasNeighbourOfType(direction, blockId, blocks, iS, ijS, airBlock)) {
                        CSFX.setFace(direction, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1);
                    } else if (block !== waterBlock && CSFX.hasNeighbourOfType(direction, blockId, blocks, iS, ijS, waterBlock)) {
                        CSFX.setFace(direction, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2);
                    }
                }

                // Not inbounds -> only +
                // if (direction >= 3) { // x+, y+, z+
                else if (direction === 3)
                {
                    const xblock = nbX[blockId - iS + 1];
                    if (block !== airBlock && xblock === airBlock) { // i+
                        CSFX.setFace(3, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1);
                    }
                    else if (block === airBlock && xblock !== airBlock && xblock !== undefined) { // i+
                        CSFX.setFace(0, blockId, xblock, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1, true);
                    } else if (block !== waterBlock && xblock === waterBlock) {
                        CSFX.setFace(3, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2);
                    }
                    else if (block === waterBlock && xblock !== waterBlock && xblock !== undefined) {
                        CSFX.setFace(0, blockId, xblock, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2, true);
                    }
                }
                else if (direction === 4)
                { // j+
                    const yblock = nbY[blockId - ijS + iS];
                    if (block !== airBlock && yblock === airBlock) {
                        CSFX.setFace(4, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1);
                    }
                    else if (block === airBlock && yblock !== airBlock && yblock !== undefined) {
                        CSFX.setFace(1, blockId, yblock, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1, true);
                    } else if (block !== waterBlock && yblock === waterBlock) {
                        CSFX.setFace(4, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2);
                    }
                    else if (block === waterBlock && yblock !== waterBlock && yblock !== undefined) {
                        CSFX.setFace(1, blockId, yblock, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2, true);
                    }
                }
                else if (direction === 5)
                { // k+
                    const zblock = nbZ[blockId - capacity + ijS];
                    if (block !== airBlock && zblock === airBlock) {
                        CSFX.setFace(5, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1);
                    }
                    else if (block === airBlock && zblock !== airBlock && zblock !== undefined) {
                        CSFX.setFace(2, blockId, zblock, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 1, true);
                    } else if (block !== waterBlock && zblock === waterBlock) {
                        CSFX.setFace(5, blockId, block, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2);
                    }
                    else if (block === waterBlock && zblock !== waterBlock && zblock !== undefined) {
                        CSFX.setFace(2, blockId, zblock, faces, surfaceFaces,
                            encounteredFaces, connectedComponents, capacity, iS, ijS, 2, true);
                    }
                }
            }
        }
    }

    static extractRawFaces(
        blocks, neighbourBlocks, surfaceBlocks, faces, surfaceFaces, encounteredFaces,
        connectedComponents, dims)
    {
        const iS = dims[0];
        const jS = dims[1];
        const kS = dims[2];

        const ijS = iS * jS;
        const capacity = ijS * kS;

        let nbX = neighbourBlocks[0]; // On x+ boundary.
        let nbY = neighbourBlocks[2]; // On y+ boundary.
        let nbZ = neighbourBlocks[4]; // On z+ boundary.

        // Extract faces.
        for (let z in surfaceBlocks)
        {
            if (!surfaceBlocks.hasOwnProperty(z)) continue;
            let layer = surfaceBlocks[z];
            CSFX.extractRawFacesPerLayer(
                z, layer,
                iS, jS, kS, ijS, capacity,
                nbX, nbY, nbZ,
                blocks, faces, surfaceFaces, encounteredFaces, connectedComponents
            );
        }

        if (CSFX.debug) {
            console.log(
                `Surface block layers ${Object.keys(surfaceBlocks).length} surface faces: (` +
                `${surfaceFaces[0].length},${surfaceFaces[1].length},${surfaceFaces[2].length}`
            );
        }
    }

    /**
     * @deprecated
     */
    static preMerge(
        surfaceFaces, connectedComponents, encounteredFaces,
        faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, chunk)
    {
        const ci = chunk.chunkI;
        const cj = chunk.chunkJ;
        const ck = chunk.chunkK;

        let ayes = surfaceFaces['0'];
        let jays = surfaceFaces['1'];
        let kays = surfaceFaces['2'];

        let ayesLength = ayes.length;
        let jaysLength = jays.length;
        let kaysLength = kays.length;

        let ayeCurrent = 0;
        let jayCurrent = 0;
        let kayCurrent = 0;

        ayes.sort(function(a, b) {return a - b;});
        jays.sort(function(a, b) {return a - b;});
        kays.sort(function(a, b) {return a - b;});

        if (CSFX.debugIJKRecursion) {
            console.log(`${ayesLength} is`);
            console.log(`${jaysLength} js`);
            console.log(`${kaysLength} ks`);
        }
        //console.log(kays);

        let currentBlock = capacity;
        if (ayesLength > 0) currentBlock = ayes[ayeCurrent];
        if (jaysLength > 0) currentBlock = Math.min(currentBlock, jays[jayCurrent]);
        if (kaysLength > 0) currentBlock = Math.min(currentBlock, kays[kayCurrent]);

        while ((ayeCurrent < ayesLength || jayCurrent < jaysLength || kayCurrent < kaysLength) &&
            currentBlock < capacity)
        {
            if (ayes[ayeCurrent] === currentBlock) {
                if (CSFX.debugIJKRecursion) console.log(`i ${ayeCurrent} ${ayes[ayeCurrent]}`);
                FaceLinker.linkI(ayes[ayeCurrent], connectedComponents, encounteredFaces, faces,
                    merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck);
                ayeCurrent++;
            }

            if (jays[jayCurrent] === currentBlock) {
                if (CSFX.debugIJKRecursion) console.log(`j ${jayCurrent} ${jays[jayCurrent]}`);
                FaceLinker.linkJ(jays[jayCurrent], connectedComponents, encounteredFaces, faces,
                    merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck);
                jayCurrent++;
            }

            if (kays[kayCurrent] === currentBlock) {
                if (CSFX.debugIJKRecursion) console.log(`k ${kayCurrent} ${kays[kayCurrent]}`);
                FaceLinker.linkK(kays[kayCurrent], connectedComponents, encounteredFaces, faces,
                    merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck);
                kayCurrent++;
            }

            ++currentBlock;
        }

        if (kayCurrent !== kaysLength)
            console.log(`WARN. kays not recursed: ${kayCurrent} out of ${kaysLength}`);
        if (jayCurrent !== jaysLength)
            console.log(`WARN. jays not recursed: ${jayCurrent} out of ${jaysLength}`);
        if (ayeCurrent !== ayesLength)
            console.log(`WARN. ayes not recursed: ${ayeCurrent} out of ${ayesLength}`);

        if (CSFX.debug) console.log('PreMerge successufl! PreMerger state:');
        if (CSFX.debug) console.log(merger);
    }

    static computeFastConnectedComponents(connectedComponents, fastCC) {
        for (let i = 0, length = connectedComponents.length; i < length; ++i) {
            if (connectedComponents[i] === 0) continue;
            if (!fastCC.hasOwnProperty(connectedComponents[i]))
                fastCC[connectedComponents[i]] = [i];
            else fastCC[connectedComponents[i]].push(i);
        }
    }

    /**
     * @deprecated
     */
    static postMerge(merger, fastCC, connectedComponents) {
        function mergeArrays(a, b) {
            let result = a;
            for (let i = 0; i < b.length; ++i) {
                if (a.indexOf(b[i]) < 0) a.push(b[i]);
            }
            return result;
        }

        let fastMerger = [];
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

        if (CSFX.debug) console.log('PostMerger initialized... PostMerger state:');
        if (CSFX.debug) console.log(fastMerger);

        if (CSFX.debugPostMerger) console.log('Merger:');
        if (CSFX.debugPostMerger) console.log(merger);
        if (CSFX.debugPostMerger) console.log('Fast merger:');
        if (CSFX.debugPostMerger) console.log(fastMerger);
        if (CSFX.debugPostMerger) console.log('Initial components:');
        if (CSFX.debugPostMerger) console.log(Object.keys(fastCC));

        if (CSFX.forceOneComponentPerChunk) {
            fastMerger = [[]];
            let ks = Object.keys(fastCC);
            for (let i = 0; i < ks.length; ++i) {
                fastMerger[0].push(parseInt(ks[i], 10));
            }
        }

        for (let k = 0, fmLength = fastMerger.length; k < fmLength; ++k) {
            fastMerger[k].sort(function(a, b) {return a - b;});
            let id = fastMerger[k][0];
            if (!fastCC.hasOwnProperty(id)) {
                // TODO [HIGH] refactor all that bullshit
                // console.log(`PostMerger failed because of id inconsistency: ${id}.`);
                continue;
            }
            let componentsToMerge = fastMerger[k];

            if (CSFX.debug) console.log(
                `Merging ${componentsToMerge.length} component(s) to ${id}:`);
            if (CSFX.debug) console.log(componentsToMerge);

            for (let i = 1, ctmLength = componentsToMerge.length; i < ctmLength; ++i) {
                let toMerge = componentsToMerge[i];
                if (CSFX.debug) console.log(`\t${toMerge}`);
                if (!fastCC.hasOwnProperty(toMerge)) {
                    if (CSFX.debugPostMerger) console.log('WARN. ' +
                        `PostMerger failed during sub-merge because of id inconsistency: ${toMerge}`);
                    continue;
                }
                let ccToMerge = fastCC[toMerge];
                // if (CSFX.debug) console.log(ccToMerge);

                // Merge: update connected components
                for (let j = 0, cctmLength = ccToMerge.length; j < cctmLength; ++j)
                    connectedComponents[ccToMerge[j]] = id;

                // Merge: update fast components
                for (let j = 0, cctmLength = ccToMerge.length; j < cctmLength; ++j)
                    fastCC[id].push(ccToMerge[j]);

                delete fastCC[toMerge];
            }
        }

        if (CSFX.debugPostMerger) console.log('Final components:');
        if (CSFX.debugPostMerger) console.log(Object.keys(fastCC));
    }

    static computeFastConnectedComponentIds(fastCC, fastCCIds, capacity, faces) {
        for (let cccid in fastCC) {
            if (!fastCC.hasOwnProperty(cccid)) continue;
            fastCCIds[cccid] = [];
            let tcur = fastCCIds[cccid];
            let fcc = fastCC[cccid];
            for (let i in fcc) {
                if (!fcc.hasOwnProperty(i)) continue;
                let j = fcc[i];
                let orientation = j < capacity ? 0 : j < 2 * capacity ? 1 : 2;
                let realId = j % capacity;
                tcur.push(faces[orientation][realId]);
            }
        }
    }

    static getNeighbourChunks(neighbourChunks, chunk, neighbourBlocks) {
        //neighbourChunks.push();
        for (let i = 0; i < 18; ++i) {
            neighbourChunks.push(ChunkBuilder.getNeighboringChunk(chunk, i));
            neighbourBlocks.push(neighbourChunks[i].blocks);
        }
    }

    //
    static extractConnectedComponents(chunk) {
        let neighbourChunks = [];
        let neighbourBlocks = [];

        // Get all six neighbour chunks.
        CSFX.getNeighbourChunks(neighbourChunks, chunk, neighbourBlocks);

        // Properties
        let surfaceBlocks = chunk.surfaceBlocks;
        let blocks = chunk.blocks;

        // Static properties
        const dims = chunk.dimensions;
        // const iS = chunk.dimensions[0];
        // const ijS = chunk.dimensions[0] * chunk.dimensions[1];
        const capacity = blocks.length;

        // Temporary variables
        let surfaceFaces = {0:[], 1:[], 2:[]};
        let faces = [new Int32Array(capacity), new Int32Array(capacity), new Int32Array(capacity)];
        let encounteredFaces = new Uint16Array(3 * capacity); // initializes all to 0

        // Results
        let connectedComponents = new Uint16Array(3 * capacity); // ditto
        let fastCC = {};
        let fastCCIds = {};

        // Compute raw faces.
        CSFX.extractRawFaces(
            blocks, neighbourBlocks, surfaceBlocks,
            faces, surfaceFaces, encounteredFaces, connectedComponents, dims);

        // Post merger.
        // let merger = [];

        // Triple PreMerge.
        // CSFX.preMerge(
        //     surfaceFaces, connectedComponents, encounteredFaces, faces,
        //     merger, capacity, iS, ijS, blocks, neighbourBlocks, chunk);

        // Compute fast connected components.
        CSFX.computeFastConnectedComponents(connectedComponents, fastCC);
        //console.log(fastCC);

        // PostMerge.
        // CSFX.postMerge(merger, fastCC, connectedComponents);
        //console.log(merger);
        //for (let i in connectedComponents) {
        //    if (connectedComponents[i] != 0) console.log('\t' + i + ' | ' + connectedComponents[i]);
        //}

        // Debugging fastCC
        for (let i in fastCC) {
            for (let faceId = 0; faceId < fastCC[i].length; ++faceId)
            {
                if (fastCC[i].indexOf(fastCC[i][faceId]) !== faceId)
                    console.log('Detected duplicate face.');

                let dir = fastCC[i][faceId] < capacity ? 0 : fastCC[i][faceId] < 2 * capacity ? 1 : 2;

                if (CSFX.debugFastCC)
                    if (faces[dir][fastCC[i][faceId] % capacity] === 0)
                        console.log(
                            `Face ${fastCC[i][faceId]} null: ${faces[dir][fastCC[i][faceId] % capacity]}`
                        );
            }
        }

        // Induce Ids.
        CSFX.computeFastConnectedComponentIds(fastCC, fastCCIds, capacity, faces);

        // Assign
        chunk.fastComponents = fastCC;
        chunk.fastComponentsIds = fastCCIds;
        chunk.connectedComponents = connectedComponents;

        if (CSFX.debugFastCC) {
            //console.log(fastCC);
            //console.log(fastCCIds);
        }
        if (CSFX.debug)
            console.log(`${Object.keys(fastCC).length} connected components extracted...`);
    }
}

export default CSFX;
