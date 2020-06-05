/**
 *
 */

'use strict';

import Chunk            from './../../model_world/chunk';
// import WorldType        from './../../model_world/model';

import GenSimplePerlin  from './generator_simple_perlin.js';
import { WorldType } from '../../model_world/model';
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
        }
    }
}

export default ChunkGenerator;
