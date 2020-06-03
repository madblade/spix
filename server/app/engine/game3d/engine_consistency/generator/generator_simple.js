/**
 *
 */

'use strict';

import ChunkGenerator from './chunkgenerator';

class Simple
{
    // Set all cubes until a given height to a given id.
    static fillChunk(chunk, toZ, blockId) {
        if (typeof toZ !== 'number') return;
        if (typeof blockId !== 'number') return;
        if (ChunkGenerator.debug) console.log(`Generating chunk ${chunk.chunkId} to ${toZ}...`);

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
         console.log(numberAdded + ' different block(s) added.');
         */

        chunk.blocks = blocks;

        if (ChunkGenerator.debug) console.log(`\t${chunk.blocks.length} blocks generated.`);
    }
}

export default Simple;
