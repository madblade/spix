
'use strict';

import { WorldMap } from './terrain/world';

/**
 * WorldMap
 */

class GenerationEngine
{
    constructor(game)
    {
        this._game = game;
    }

    generateWorldMap()
    {
        let world = new WorldMap();
        world.seedWorld();
        world.generateIfNeeded(0, 0);
    }
}

export default GenerationEngine;
