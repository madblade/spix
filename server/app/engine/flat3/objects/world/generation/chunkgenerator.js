/**
 *
 */

'use strict';

import Chunk from './../chunk';
import ExtractionAPI from './../extraction/extractionapi';

class ChunkGenerator {

    static debug = false;

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call ExtractionAPI.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, worldManager) {
        console.log('createRawChunk ' + id);
        var c = new Chunk(x, y, z, id, worldManager);

        // Flat homogeneous.
        //ChunkGenerator.testChunk(c);
        //ChunkGenerator.testMerge(c);
        //ChunkGenerator.fillChunk(c, 40, 1);

        ChunkGenerator.waveChunk(c, 40, 48, 1);

        return c;
    }

    static createChunk(x, y, z, id, worldManager) {
        //console.log('createChunk ' + id);
        var c = new Chunk(x, y, z, id, worldManager);

        let generationMethod = worldManager.generationMethod;
        if (generationMethod == 'flat') {
            //ChunkGenerator.fillChunk(c, 32, 1);
            ChunkGenerator.waveChunk(c, 40, 48, 1);
            //ChunkGenerator.fillChunk(c, 256, 0);
        } else {

        }

        return c;
    }

    static testMerge(chunk) {
        const dx = chunk.dimensions[0];
        const dy = chunk.dimensions[1];
        const ijS = dx * dy;
        const numberOfBlocks = chunk.capacity;

        let blocks = new Uint8Array(numberOfBlocks);

        blocks.fill(1, 0, ijS*40);

        for (let k = 0; k<6; ++k) {
            for (let i = 0; i<2; ++i) {
                for (let j = 0; j<2; ++j) {
                    blocks[ijS*40-10-i-j*dx-k*dx*dy] = 0;
                }
            }
        }

        for (let k = 0; k<6; ++k) {
            for (let i = 0; i<2; ++i) {
                for (let j = 0; j<2; ++j) {
                    blocks[ijS*40-42-i-j*dx-k*dx*dy] = 0;
                }
            }
        }

        for (let k = 0; k<6; ++k) {
            for (let i = 0; i<2; ++i) {
                for (let j = 0; j<2; ++j) {
                    blocks[ijS*40-28-i-j*dx-k*dx*dy] = 0;
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

        const idx1 = ijS*48 + dx*4+4;
        blocks[idx1] = 1;
        blocks[idx1 + ijS] = 0;
        blocks[idx1 + 2*ijS] = 1;

        blocks[idx1-1] = 1;
        blocks[idx1+1] = 1;

        blocks[idx1+1+ijS] = 1;
        blocks[idx1+1+2*ijS] = 1;

        blocks[idx1-1+ijS] = 1;
        blocks[idx1-1+2*ijS] = 1;

        blocks[idx1-1+ijS+dx] = 1;
        blocks[idx1-1+ijS-dx] = 1;
        blocks[idx1-1+2*ijS+dx] = 1;
        blocks[idx1-1+2*ijS-dx] = 1;

        blocks[idx1+1+ijS+dx] = 1;
        blocks[idx1+1+ijS-dx] = 1;
        blocks[idx1+1+2*ijS+dx] = 1;
        blocks[idx1+1+2*ijS-dx] = 1;

        blocks[idx1+ijS+dx] = 1;
        blocks[idx1+ijS-dx] = 1;
        blocks[idx1+2*ijS+dx] = 1;
        blocks[idx1+2*ijS-dx] = 1;


        blocks[idx1-1+dx] = 1;
        blocks[idx1+1+dx] = 1;
        blocks[idx1-1-dx] = 1;
        blocks[idx1+1-dx] = 1;
        blocks[idx1+dx] = 1;
        blocks[idx1-dx] = 1;

        chunk.blocks = blocks;
    }

    // Set all cubes until a given height to a given id.
    static fillChunk(chunk, toZ, blockId) {
        if (typeof toZ !== "number") return;
        if (typeof blockId !== "number") return;
        if (ChunkGenerator.debug) console.log('Generating chunk ' + chunk.chunkId + ' to ' + toZ + '...');

        const numberOfBlocksToFill = chunk.dimensions[0] * chunk.dimensions[1] * toZ;
        const numberOfBlocks = chunk.capacity;

        let blocks = new Uint8Array(numberOfBlocks);
        blocks.fill(blockId, 0, numberOfBlocksToFill);
        blocks.fill(0, numberOfBlocksToFill, numberOfBlocks);

        //blocks[3122] = 1;
        //blocks[3186] = 1;

        /*
         let numberAdded = 0;
         for (let i = numberOfBlocksToFill; i<numberOfBlocksToFill+this._xSize*this._ySize; ++i) {
         if (Math.random() > 0.5) {
         blocks[i] = blockId;
         numberAdded++;
         }
         }
         console.log(numberAdded + " different block(s) added.");
         */

        chunk.blocks = blocks;

        if (ChunkGenerator.debug) console.log("\t" + chunk.blocks.length + " blocks generated.");
    }

    static waveChunk(chunk, minZ, maxZ, blockId) {
        if (minZ >= maxZ || maxZ >= chunk.capacity) console.log("Wave generator: invalid parameters");



        const dx = chunk.dimensions[0];
        const dy = chunk.dimensions[1];
        const deltaK = maxZ-minZ;

        const underneathWave = dx * dy * minZ;
        const overWave = dx * dy * maxZ;
        const numberOfBlocks = chunk.capacity;

        const offsetX = chunk.chunkI*dx;
        const offsetY = chunk.chunkJ*dy;
        let fn = ((i, j) => {
            let x = (i + offsetX)*100;
            let y = (j + offsetY)*100;
            return 0.3*deltaK*(1.57079632679 +
                .6 * Math.sin(x - y + 2 * Math.sin(y))
                + .3 * Math.sin(x * 2 + y * 2 * 1.81)
                + .1825 * Math.sin(x * 3 - y * 2 * 2.18));
        });

        let blocks = new Uint8Array(numberOfBlocks);
        if (chunk.chunkK !== 0) {
            blocks.fill(0, 0, numberOfBlocks);
            return;
        }
        blocks.fill(blockId, 0, underneathWave);

        blocks.fill(0, underneathWave, overWave);
        let index = underneathWave;
        for (let k = 0, l = deltaK; k < l; ++k) {
            for (let i = 0; i < dx; ++i) {
                for (let j = 0; j < dy; ++j) {
                    if (k < fn(i, j)) blocks[index] = blockId;
                    index++;
                }
            }
        }

        blocks.fill(0, overWave, numberOfBlocks);

        chunk.blocks = blocks;
        if (ChunkGenerator.debug) console.log("\t" + chunk.blocks.length + " blocks generated.");
    }

}

export default ChunkGenerator;
