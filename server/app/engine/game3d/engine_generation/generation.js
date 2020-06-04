
'use strict';

import { WorldMap } from './terrain/world';

/**
 * WorldMap
 * Only for FlatWorld.
 */

class GenerationEngine
{
    constructor(game)
    {
        this._game = game;
        this._worldMaps = new Map();
    }

    initializeWorldMap(worldId)
    {
        let worldMap = new WorldMap();
        worldMap.seedWorld();
        this._worldMaps.set(worldId, worldMap);
    }

    stepWorldMapGeneration(entities)
    {
        // TODO check entity position against loaded tiles
        entities.forEach(entity => {
            let p = entity.p0;
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
