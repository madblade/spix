/**
 *
 */

'use strict';

import ChunkLoader from './../chunkloader';

class CSBX {
    
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
        let sbs = chunk.surfaceBlocks;
        let blocks = chunk.blocks;
        let nBlocks = this._neighborBlocks;

        const iSize = chunk.dimensions[0];
        const ijSize = chunk.dimensions[0] * chunk.dimensions[1];
        const length = blocks.length;

        var addSurfaceBlock = function (bid) {
            const ijC = bid % ijSize;
            const z = (bid - ijC) / ijSize;
            if (sbs.hasOwnProperty(z)) sbs[z].push((ijC));
            else sbs[z] = [ijC];
            return true;
        };

        // Test neighbourhood.
        for (let b = 0; b < length; ++b) {
            if (blocks[b] !== 0) {
                const iPlus = b+1;
                if (iPlus % iSize === 0) {
                    if (blocks[iPlus] === 0 && addSurfaceBlock(b)) {
                        continue;
                    }
                } else // Access other chunk
                if (nBlocks[0][iPlus-iSize] === 0 && addSurfaceBlock(b)) {
                    continue;
                }

                const iMinus = b-1;
                if (iMinus % iSize !== iSize-1) {
                    if (blocks[iMinus] === 0 && addSurfaceBlock(b)) {
                        continue;
                    }
                } else  // Access other chunk
                if (nBlocks[1][iMinus+iSize] === 0 && addSurfaceBlock(b)) {
                    continue;
                }

                const jPlus = b+iSize;
                if ((jPlus-b%iSize) % ijSize !== 0) {
                    if (blocks[jPlus] === 0 && addSurfaceBlock(b)) {
                        continue;
                    }
                } else // Access other chunk
                if (nBlocks[2][jPlus-ijSize] === 0 && addSurfaceBlock(b)) {
                    continue;
                }

                const jMinus = b-iSize;
                if ((jMinus-b%iSize) % ijSize !== ijSize-1) {
                    if (blocks[jMinus] === 0 && addSurfaceBlock(b)) {
                        continue;
                    }
                } else // Access other chunk
                if (nBlocks[2][jMinus+ijSize] === 0 && addSurfaceBlock(b)) {
                    continue;
                }

                // TODO zeefy chunks...
                const kPlus = b+ijSize;
                if (kPlus < length) {
                    if (blocks[kPlus] === 0 && addSurfaceBlock(b)) continue;
                } else {
                    // Not supported in this model.
                }

                const kMinus = b-ijSize;
                if (kMinus >= 0) {
                    if (blocks[kMinus] === 0) addSurfaceBlock(b);
                } else {
                    // Not supported in this model.
                }

            }
        }

    }

}

export default CSBX;
