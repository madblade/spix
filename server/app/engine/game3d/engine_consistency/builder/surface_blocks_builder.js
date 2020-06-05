/**
 *
 */

'use strict';

import ChunkBuilder from './builder_chunks';
import { BlockType } from '../../model_world/model';

class CSBX
{
    static debug = false;

    static extractSurfaceBlocks(chunk)
    {
        let neighbourChunks = [];
        let neighbourBlocks = [];

        const numberOfNeighbours = 6;

        // Get all neighbour chunks.
        for (let i = 0; i < numberOfNeighbours; ++i)
        {
            neighbourChunks.push(ChunkBuilder.getNeighboringChunk(chunk, i));
            neighbourBlocks.push(neighbourChunks[i].blocks);
        }

        let currentSbs = chunk.surfaceBlocks;
        let blocks = chunk.blocks;

        const iSize = chunk.dimensions[0];
        const ijSize = chunk.dimensions[0] * chunk.dimensions[1];
        const capacity = blocks.length;

        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;

        // Test neighbourhood.
        for (let b = 0; b < capacity; ++b)
        {
            const currentBlock = blocks[b];

            // Air surface
            if (currentBlock !== airBlock) {
                if (CSBX.processNeighborhoodFromBlockEqual(
                    b, iSize, ijSize, capacity, blocks, neighbourBlocks, currentSbs, airBlock
                )) continue; // No need to do the water check.
            } else if (currentBlock === airBlock) { // If the current block is air, test for neighbour x+/y+/z+
                if (CSBX.processNeighborhoodFromBlockDifferent(
                    b, iSize, ijSize, capacity, neighbourBlocks, currentSbs, airBlock
                )) continue; // No need to do the water check.
            }

            // Water surface
            if (currentBlock !== waterBlock) {
                CSBX.processNeighborhoodFromBlockEqual(
                    b, iSize, ijSize, capacity, blocks, neighbourBlocks, currentSbs, waterBlock
                );
            } else if (currentBlock === waterBlock) { // If the current block is water
                CSBX.processNeighborhoodFromBlockDifferent(
                    b, iSize, ijSize, capacity, neighbourBlocks, currentSbs, waterBlock
                );
            }
        }
    }

    static addSurfaceBlock(bid, sbs, ijSize)
    {
        const ijC = bid % ijSize;
        const z = (bid - ijC) / ijSize;
        if (sbs.hasOwnProperty(z)) sbs[z].push(ijC);
        else sbs[z] = [ijC];
    }

    static processNeighborhoodFromBlockDifferent(
        b, iSize, ijSize, capacity,
        neighbourBlocks, currentSbs, blockType)
    {
        const iPlus = b + 1;
        if (iPlus % iSize === 0) {
            if (neighbourBlocks[0][iPlus - iSize] !== blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
        }

        const jPlus = b + iSize;
        if ((jPlus - b % iSize) % ijSize === 0) {
            if (neighbourBlocks[2][jPlus - ijSize] !== blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
        }

        const kPlus = b + ijSize;
        if (kPlus >= capacity) {
            if (neighbourBlocks[4][kPlus - capacity] !== blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
        }
    }

    static processNeighborhoodFromBlockEqual(
        b, iSize, ijSize, capacity,
        blocks, neighbourBlocks, currentSbs,
        blockType)
    {
        const iPlus = b + 1;
        if (iPlus % iSize !== 0) {
            if (blocks[iPlus] === blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
            // Access other chunk
        } else if (neighbourBlocks[0][iPlus - iSize] === blockType) {
            CSBX.addSurfaceBlock(b, currentSbs, ijSize);
            return true;
        }

        const iMinus = b - 1;
        if (iMinus % iSize !== iSize - 1) {
            if (blocks[iMinus] === blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
            // Access other chunk
        } else if (neighbourBlocks[1][iMinus + iSize] === blockType) {
            CSBX.addSurfaceBlock(b, currentSbs, ijSize);
            return true;
        }

        const jPlus = b + iSize;
        if ((jPlus - b % iSize) % ijSize !== 0) {
            if (blocks[jPlus] === blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
            // Access other chunk
        } else  if (neighbourBlocks[2][jPlus - ijSize] === blockType) {
            CSBX.addSurfaceBlock(b, currentSbs, ijSize);
            return true;
        }

        const jMinus = b - iSize;
        if ((jMinus - b % iSize) % ijSize !== ijSize - 1) {
            if (blocks[jMinus] === blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
            // Access other chunk
        } else if (neighbourBlocks[3][jMinus + ijSize] === blockType) {
            CSBX.addSurfaceBlock(b, currentSbs, ijSize);
            return true;
        }

        const kPlus = b + ijSize;
        if (kPlus < capacity) {
            if (blocks[kPlus] === blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
        } else if (neighbourBlocks[4][kPlus - capacity] === blockType) {
            CSBX.addSurfaceBlock(b, currentSbs, ijSize);
            return true;
        }

        const kMinus = b - ijSize;
        if (kMinus >= 0) {
            if (blocks[kMinus] === blockType) {
                CSBX.addSurfaceBlock(b, currentSbs, ijSize);
                return true;
            }
        } else if (neighbourBlocks[5][kMinus + capacity] === blockType) {
            CSBX.addSurfaceBlock(b, currentSbs, ijSize);
            return true;
        }

        if (CSBX.debug) console.log(`${b} is not a neighbour.`);
    }
}

export default CSBX;
