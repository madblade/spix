/**
 *
 */

'use strict';

import ChunkGenerator from './chunkgenerator';

class Analytic
{
    static waveChunk(chunk, minZ, maxZ, blockId)
    {
        if (minZ >= maxZ || maxZ >= chunk.capacity)
            console.log('Wave generator: invalid parameters');

        const dx = chunk.dimensions[0];
        const dy = chunk.dimensions[1];
        const deltaK = maxZ - minZ;

        const underneathWave = dx * dy * minZ;
        const overWave = dx * dy * maxZ;
        const numberOfBlocks = chunk.capacity;

        const offsetX = chunk.chunkI * dx;
        const offsetY = chunk.chunkJ * dy;
        let fn = (i, j) => {
            let x = (i + offsetX) * 100;
            let y = (j + offsetY) * 100;
            return 0.3 * deltaK * (1.57079632679 +
                .6 * Math.sin(x - y + 2 * Math.sin(y)) +
                .3 * Math.sin(x * 2 + y * 2 * 1.81) +
                .1825 * Math.sin(x * 3 - y * 2 * 2.18));
        };

        let blocks = new Uint8Array(numberOfBlocks);
        if (chunk.chunkK !== 0)
        {
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
        if (ChunkGenerator.debug) console.log(`\t${chunk.blocks.length} blocks generated.`);
    }
}

export default Analytic;
