/**
 *
 */

'use strict';

import Chunk            from './../../model_world/chunk';
// import WorldType        from './../../model_world/model';

import GenSimplePerlin  from './generator_simple_perlin.js';
import { BlockType, WorldType } from '../../model_world/model';
import FantasyGenerator from './generator_fantasy';

class ChunkGenerator
{
    static debug = false;

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call Extractor.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, world)
    {
        let c = new Chunk(x, y, z, id, world);

        // let shuffleChunks = false; // Can be set to activated to test for initial chunk.
        // GenSimplePerlin.simplePerlinGeneration(
        //     c, shuffleChunks, world.worldId, world.worldInfo
        // );
        world.pushChunkForGeneration(id);

        return c;
    }

    static createChunk(x, y, z, id, world)
    {
        let c = new Chunk(x, y, z, id, world);

        // GenSimplePerlin.simplePerlinGeneration(
        //     c, false, world.worldId, world.worldInfo
        // );
        world.pushChunkForGeneration(id);

        return c;
    }

    static generateChunkBlocks(chunk, worldMap)
    {
        const worldId = chunk.world.worldId;
        const worldInfo = chunk.world.worldInfo;
        if (worldInfo.type === WorldType.FANTASY)
        {
            FantasyGenerator.simpleFantasyGeneration(worldMap, chunk);
        }
        else
        {
            GenSimplePerlin.simplePerlinGeneration(
                chunk, false, worldId, worldInfo
            );

            // Correction for 0,0
            if (
                worldInfo.type === WorldType.FLAT &&
                chunk.chunkI === 0 &&
                chunk.chunkJ === 0 &&
                chunk.chunkK === 0 &&
                chunk.dimensions[0] === 32 &&
                chunk.dimensions[1] === 32
            )
            {
                let b = chunk.blocks;
                const n = chunk.dimensions[0];
                const onm = 16 * chunk.dimensions[0] * chunk.dimensions[1];
                for (let j = -2; j < 2; ++j)
                {
                    const o = (16 + j) * n + 16;
                    for (let i = -2; i < 2; ++i)
                    {
                        b[onm + o + i] = BlockType.STONEBRICKS;
                    }
                }
            }
        }
    }
}

export default ChunkGenerator;
