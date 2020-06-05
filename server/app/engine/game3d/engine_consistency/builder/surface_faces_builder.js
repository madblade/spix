/**
 *
 */

'use strict';

import ChunkBuilder from './builder_chunks';
import { BlockType } from '../../model_world/model';

class CSFX
{
    static debug = false;
    static debugFastCC = false;

    static inbounds(d, b, iS, ijS, capacity)
    {
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

    static empty(d, b, bs, iS, ijS)
    {
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

    static hasNeighbourOfType(d, b, bs, iS, ijS, blockType)
    {
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

    static extractRawFacesPerBlock(
        // z, layer,
        blockId,
        iS, jS, kS, ijS, capacity,
        nbX, nbY, nbZ,
        blocks, faces, surfaceFaces, encounteredFaces, connectedComponents
    )
    {
        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;
        // !air-air => ccid = 1
        // !water-water => ccid = 2

        const block = blocks[blockId];

        for (let direction = 0; direction < 6; ++direction)
        {
            if (CSFX.inbounds(direction, blockId, iS, ijS, capacity)) {
                if (block !== airBlock &&
                    CSFX.hasNeighbourOfType(direction, blockId, blocks, iS, ijS, airBlock))
                {
                    CSFX.setFace(direction, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        block !== waterBlock ? 1 : 2); // this face is rock or water surface
                } else if (block !== airBlock && block !== waterBlock &&
                    CSFX.hasNeighbourOfType(direction, blockId, blocks, iS, ijS, waterBlock))
                {
                    CSFX.setFace(direction, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1); // this face is underwater
                }
            }

            // Not inbounds -> only +
            // if (direction >= 3) { // x+, y+, z+
            else if (direction === 3)
            {
                const xblock = nbX[blockId - iS + 1];
                if (block !== airBlock && xblock === airBlock) { // i+
                    CSFX.setFace(3, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        block !== waterBlock ? 1 : 2);
                }
                else if (block === airBlock && xblock !== airBlock && xblock !== undefined) { // i+
                    CSFX.setFace(0, blockId, xblock, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        xblock !== waterBlock ? 1 : 2, true);
                }
                else if (block !== airBlock && block !== waterBlock && xblock === waterBlock) {
                    CSFX.setFace(3, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1);
                }
                else if (block === waterBlock && xblock !== airBlock && xblock !== waterBlock && xblock !== undefined) {
                    CSFX.setFace(0, blockId, xblock, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1, true);
                }
            }
            else if (direction === 4)
            { // j+
                const yblock = nbY[blockId - ijS + iS];
                if (block !== airBlock && yblock === airBlock) {
                    CSFX.setFace(4, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        block !== waterBlock ? 1 : 2);
                }
                else if (block === airBlock && yblock !== airBlock && yblock !== undefined)
                {
                    CSFX.setFace(1, blockId, yblock, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        yblock !== waterBlock ? 1 : 2, true);
                }
                else if (block !== airBlock && block !== waterBlock && yblock === waterBlock)
                {
                    CSFX.setFace(4, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1);
                }
                else if (block === waterBlock && yblock !== airBlock && yblock !== waterBlock && yblock !== undefined)
                {
                    CSFX.setFace(1, blockId, yblock, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1, true);
                }
            }
            else if (direction === 5)
            { // k+
                const zblock = nbZ[blockId - capacity + ijS];
                if (block !== airBlock && zblock === airBlock) {
                    CSFX.setFace(5, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        block !== waterBlock ? 1 : 2);
                }
                else if (block === airBlock && zblock !== airBlock && zblock !== undefined)
                {
                    CSFX.setFace(2, blockId, zblock, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        zblock !== waterBlock ? 1 : 2, true);
                }
                else if (block !== airBlock && block !== waterBlock && zblock === waterBlock)
                {
                    CSFX.setFace(5, blockId, block, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1);
                }
                else if (block === waterBlock && zblock !== airBlock && zblock !== waterBlock && zblock !== undefined)
                {
                    CSFX.setFace(2, blockId, zblock, faces, surfaceFaces,
                        encounteredFaces, connectedComponents, capacity, iS, ijS,
                        1, true);
                }
            }
        }
        // }
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
        for (let i = 0; i < surfaceBlocks.length; ++i)
        {
            const id = surfaceBlocks[i];
            CSFX.extractRawFacesPerBlock(
                id,
                iS, jS, kS, ijS, capacity,
                nbX, nbY, nbZ,
                blocks, faces, surfaceFaces, encounteredFaces, connectedComponents
            );
        }

        if (CSFX.debug)
        {
            console.log(
                `Surface block layers ${Object.keys(surfaceBlocks).length} surface faces: (` +
                `${surfaceFaces[0].length},${surfaceFaces[1].length},${surfaceFaces[2].length}`
            );
        }
    }

    static computeFastConnectedComponents(connectedComponents, fastCC)
    {
        for (let i = 0, length = connectedComponents.length; i < length; ++i)
        {
            if (connectedComponents[i] === 0) continue;
            if (!fastCC.hasOwnProperty(connectedComponents[i]))
                fastCC[connectedComponents[i]] = [i];
            else fastCC[connectedComponents[i]].push(i);
        }
    }

    static computeFastConnectedComponentIds(
        fastCC, fastCCIds, capacity, faces
    )
    {
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

    static getNeighbourChunks(
        neighbourChunks, chunk, neighbourBlocks
    )
    {
        for (let i = 0; i < 18; ++i) {
            neighbourChunks.push(ChunkBuilder.getNeighboringChunk(chunk, i));
            neighbourBlocks.push(neighbourChunks[i].blocks);
        }
    }

    //
    static extractConnectedComponents(chunk)
    {
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
            faces, surfaceFaces, encounteredFaces, connectedComponents, dims
        );

        // Compute fast connected components.
        CSFX.computeFastConnectedComponents(connectedComponents, fastCC);

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

        if (CSFX.debugFastCC)
        {
            //console.log(fastCC);
            //console.log(fastCCIds);
        }
        if (CSFX.debug)
            console.log(`${Object.keys(fastCC).length} connected components extracted...`);
    }
}

export default CSFX;
