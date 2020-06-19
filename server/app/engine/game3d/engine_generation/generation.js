
'use strict';

import { WorldMap } from './terrain/world';
import ChunkGenerator from '../engine_consistency/generator/chunkgenerator';
import { GameType } from '../game';
import { WorldType } from '../model_world/model';

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

        this._worldMaps = new Map();
    }

    update()
    {
        let worlds = this._worldModel.worlds;

        // XXX [GENERATION] time budget.

        // Generate meta-tile for entities on edge.
        if (this._game.kind === GameType.FANTASY)
            this.stepWorldMapGeneration();

        // Generate blocks for waiting chunks.
        this.stepChunkBlockGeneration(worlds);
    }

    // N.B. No need to do that in case of non-fantasy (e.g. Perlin-only) world.
    initializeWorldMap(worldId)
    {
        let worldMap = new WorldMap();
        worldMap.seedWorld();
        this._worldMaps.set(worldId, worldMap);
    }

    stepChunkBlockGeneration(worlds)
    {
        let done = false;
        worlds.forEach((world, worldId) =>
        {
            if (done) return;
            let nextChunk = world.getNextChunkForGeneration();
            let worldMap = this._worldMaps.get(worldId);
            if (world.worldInfo.type === WorldType.FANTASY && !worldMap)
            {
                this.initializeWorldMap(worldId);
                worldMap = this._worldMaps.get(worldId);
            }

            if (nextChunk)
            {
                ChunkGenerator.generateChunkBlocks(nextChunk, worldMap);
                if (nextChunk.blocksReady)
                {
                    world.popChunkForGeneration();
                    done = true;
                }
            }
        });
    }

    stepWorldMapGeneration()
    {
        let done = false;
        let worldMaps = this._worldMaps;
        worldMaps.forEach(worldMap => {
            if (done) return;
            let tiles = worldMap.tiles;
            tiles.forEach(tile => {
                if (done) return;
                if (tile.needsGeneration)
                {
                    // console.log(tile.tileSeed);
                    tile.stepGeneration();
                }
                if (tile.ready)
                {
                    tile.needsGeneration = false;
                }
            });
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
