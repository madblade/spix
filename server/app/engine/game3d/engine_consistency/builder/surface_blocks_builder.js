/**
 *
 */

'use strict';

import ChunkLoader from './../loader/loader_chunks';

class CSBX {

    static debug = false;
    
    static extractSurfaceBlocks(chunk) {

        let neighbourChunks = [];
        let neighbourBlocks = [];

        const numberOfNeighbours = 6;

        // Get all neighbour chunks.
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
        const capacity = blocks.length;

        var addSurfaceBlock = function (bid, sbs) {
            const ijC = bid % ijSize;
            const z = (bid - ijC) / ijSize;
            if (sbs.hasOwnProperty(z)) sbs[z].push((ijC));
            else sbs[z] = [ijC];
        };

        // Test neighbourhood.
        for (let b = 0; b < capacity; ++b) {
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
                } else { // Access other chunk
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
                } else { // Access other chunk
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
                } else { // Access other chunk
                    if (neighbourBlocks[3][jMinus + ijSize] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                // TODO [HIGH] z criteria.
                const kPlus = b+ijSize;
                if (kPlus < capacity) {
                    if (blocks[kPlus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else {
                    if (neighbourBlocks[4][kPlus - capacity] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                const kMinus = b-ijSize;
                if (kMinus >= 0) {
                    if (blocks[kMinus] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                } else {
                    if (neighbourBlocks[5][kMinus+capacity] === 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                if (CSBX.debug) console.log(b + ' is not a neighbour.');

            } else { // If the current block is empty, test for neighbour x+/y+/z+
                const iPlus = b+1;
                if (iPlus % iSize === 0) {
                    if (neighbourBlocks[0][iPlus - iSize] !== 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                const jPlus = b+iSize;
                if ((jPlus-b%iSize) % ijSize === 0) {
                    if (neighbourBlocks[2][jPlus - ijSize] !== 0) {
                        addSurfaceBlock(b, currentSbs);
                        continue;
                    }
                }

                // TODO [HIGH] check z criteria.
                const kPlus = b+ijSize;
                if (kPlus === capacity) {
                    if (neighbourBlocks[4][kPlus - capacity] !== 0) {
                        addSurfaceBlock(b, currentSbs);
                        // continue;
                    }
                }
            }
        }
    }
}

export default CSBX;
