/**
 *
 */

'use strict';

// import ChunkGenerator from './chunkgenerator';

class Test {

    static testMerge(chunk) {
        const dx = chunk.dimensions[0];
        const dy = chunk.dimensions[1];
        const ijS = dx * dy;
        const numberOfBlocks = chunk.capacity;

        let blocks = new Uint8Array(numberOfBlocks);

        blocks.fill(1, 0, ijS * 40);

        for (let k = 0; k < 6; ++k) {
            for (let i = 0; i < 2; ++i) {
                for (let j = 0; j < 2; ++j) {
                    blocks[ijS * 40 - 10 - i - j * dx - k * dx * dy] = 0;
                }
            }
        }

        for (let k = 0; k < 6; ++k) {
            for (let i = 0; i < 2; ++i) {
                for (let j = 0; j < 2; ++j) {
                    blocks[ijS * 40 - 42 - i - j * dx - k * dx * dy] = 0;
                }
            }
        }

        for (let k = 0; k < 6; ++k) {
            for (let i = 0; i < 2; ++i) {
                for (let j = 0; j < 2; ++j) {
                    blocks[ijS * 40 - 28 - i - j * dx - k * dx * dy] = 0;
                }
            }
        }

        chunk.blocks = blocks;
    }

    static testChunk(chunk) {
        const dx = chunk.dimensions[0];
        const dy = chunk.dimensions[1];
        const ijS = dx * dy;
        const numberOfBlocks = chunk.capacity;

        let blocks = new Uint8Array(numberOfBlocks);

        const idx1 = ijS * 48 + dx * 4 + 4;
        blocks[idx1] = 1;
        blocks[idx1 + ijS] = 0;
        blocks[idx1 + 2 * ijS] = 1;

        blocks[idx1 - 1] = 1;
        blocks[idx1 + 1] = 1;

        blocks[idx1 + 1 + ijS] = 1;
        blocks[idx1 + 1 + 2 * ijS] = 1;

        blocks[idx1 - 1 + ijS] = 1;
        blocks[idx1 - 1 + 2 * ijS] = 1;

        blocks[idx1 - 1 + ijS + dx] = 1;
        blocks[idx1 - 1 + ijS - dx] = 1;
        blocks[idx1 - 1 + 2 * ijS + dx] = 1;
        blocks[idx1 - 1 + 2 * ijS - dx] = 1;

        blocks[idx1 + 1 + ijS + dx] = 1;
        blocks[idx1 + 1 + ijS - dx] = 1;
        blocks[idx1 + 1 + 2 * ijS + dx] = 1;
        blocks[idx1 + 1 + 2 * ijS - dx] = 1;

        blocks[idx1 + ijS + dx] = 1;
        blocks[idx1 + ijS - dx] = 1;
        blocks[idx1 + 2 * ijS + dx] = 1;
        blocks[idx1 + 2 * ijS - dx] = 1;


        blocks[idx1 - 1 + dx] = 1;
        blocks[idx1 + 1 + dx] = 1;
        blocks[idx1 - 1 - dx] = 1;
        blocks[idx1 + 1 - dx] = 1;
        blocks[idx1 + dx] = 1;
        blocks[idx1 - dx] = 1;

        chunk.blocks = blocks;
    }

}

export default Test;
