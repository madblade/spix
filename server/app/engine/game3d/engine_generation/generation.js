
'use strict';

import { WorldMap } from './terrain/world';
import ChunkGenerator from '../engine_consistency/generator/chunkgenerator';

/**
 * WorldMap
 * Only for FlatWorld.
 */

class GenerationEngine
{
    constructor(game)
    {
        this._game = game;

        // Chunks and entity positions
        this._worldModel        = game.worldModel;
        this._entityModel       = game.entityModel;

        this._worldMaps = new Map();
    }

    update()
    {
        let worlds = this._worldModel.worlds;
        let entities = this._entityModel.entities;

        // TODO time budget.

        // Generate meta-tile for entities on edge.
        this.stepWorldMapGeneration(entities, worlds);

        // Generate blocks for waiting chunks.
        this.stepChunkBlockGeneration(worlds);
    }

    initializeWorldMap(worldId)
    {
        let worldMap = new WorldMap();
        worldMap.seedWorld();
        this._worldMaps.set(worldId, worldMap);
    }

    stepChunkBlockGeneration(worlds)
    {
        let done = false;
        worlds.forEach(world =>
        {
            if (done) return;
            let nextChunk = world.popChunkForGeneration();
            if (nextChunk) {
                ChunkGenerator.generateChunkBlocks(nextChunk);
                done = true;
            }
        });
    }

    stepWorldMapGeneration(entities)
    {
        // TODO check entity position against loaded tiles
        entities.forEach(entity => {
            if (!entity) return;
            let p = entity.p0;
            let world = entity.worldId;
            // get tile
            // if !loaded tile, priority generation
            // if close to !loaded tile,
            //   push for later generation
        });
    }

    stepWorldMapGenerationAt(worldId, x, y)
    {
        let worldMap = this._worldMaps.get(worldId);
        if (!worldMap)
        {
            console.error(`Invalid world id ${worldId}.`);
        }
        worldMap.generateIfNeeded(x, y);
    }
}

export default GenerationEngine;
