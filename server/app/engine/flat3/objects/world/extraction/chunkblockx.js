/**
 *
 */

'use strict';

import ChunkLoader from './../loading/chunkloader';

class CSBX {
    
    static extractSurfaceBlocks(chunk) {

        let neighbourChunks = [];
        let neighbourBlocks = [];

        const numberOfNeighbours = 4;

        // Get all 4 neighbour chunks.
        // TODO 6 neighbours
        for (let i = 0; i < numberOfNeighbours; ++i) {
            neighbourChunks.push(ChunkLoader.getNeighboringChunk(chunk, i));
            neighbourBlocks.push(neighbourChunks[i].blocks);
        }

        let currentSbs = chunk.surfaceBlocks;
        let blocks = chunk.blocks;
        let nSbs = [];
        for (let i = 0; i < numberOfNeighbours; ++i) {
            nSbs.push({});
        }

        const iSize = chunk.dimensions[0];
        const ijSize = chunk.dimensions[0] * chunk.dimensions[1];
        const length = blocks.length;

        var addSurfaceBlock = function (bid, sbs) {
            const ijC = bid % ijSize;
            const z = (bid - ijC) / ijSize;
            if (sbs.hasOwnProperty(z)) sbs[z].push((ijC));
            else sbs[z] = [ijC];
        };

        // Test neighbourhood.
        for (let b = 0; b < length; ++b) {
            if (blocks[b] !== 0) {
                const iPlus = b+1;
                if (iPlus % iSize !== 0) {
                    if (blocks[iPlus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else { // Access other chunk
                    if (neighbourBlocks[0][iPlus - iSize] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                const iMinus = b-1;
                if (iMinus % iSize !== iSize-1) {
                    if (blocks[iMinus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else {// Access other chunk
                    if (neighbourBlocks[1][iMinus + iSize] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                const jPlus = b+iSize;
                if ((jPlus-b%iSize) % ijSize !== 0) {
                    if (blocks[jPlus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else {// Access other chunk
                    if (neighbourBlocks[2][jPlus - ijSize] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                const jMinus = b-iSize;
                if ((jMinus-b%iSize) % ijSize !== ijSize-1) {
                    if (blocks[jMinus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else {// Access other chunk
                    if (neighbourBlocks[3][jMinus + ijSize] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                // TODO zeefy chunks...
                const kPlus = b+ijSize;
                if (kPlus < length) {
                    if (blocks[kPlus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else {
                    // Not supported in this model.
                }

                const kMinus = b-ijSize;
                if (kMinus >= 0) {
                    if (blocks[kMinus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        //continue;
                    }
                } else {
                    // Not supported in this model.
                }

            }
        }

        /*for (let i = 0; i<_numberOfNeighbours; ++i) {
            if (!_neighbours[i].ready) {
                console.log(nSbs[i]);
                _neighbours[i].surfaceBlocks = nSbs[i];
                console.log(_neighbours[i].surfaceBlocks);
            }
        }*/
    }
}

export default CSBX;
