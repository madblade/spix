/**
 *
 */

'use strict';

import World from './world';
import CollectionUtils from '../../math/collections';

const BlockType = Object.freeze({
    AIR: 0,
    GRASS: 1,
    STONE: 2,
    DIRT: 3,
    WOOD: 4,
    PLANKS: 5,
    STONEBRICKS: 6,
    BRICKS: 7,
    SAND: 17,
    IRON: 18
});

const WorldType = Object.freeze({
    FLAT: Symbol('flat'),
    CUBE: Symbol('cube'),
    SHRIKE: Symbol('shrike')
});

class WorldModel {

    static serverLoadingRadius = 5;

    constructor(game)
    {
        this._game = game;

        this._worlds = new Map();

        this._worlds.set(-1, new World(-1, WorldType.CUBE, this));
    }

    get worlds() { return this._worlds; }

    addWorld(worldId)
    {
        let wid  = worldId || CollectionUtils.generateId(this._worlds);

        if (this._worlds.has(wid)) return;
        let w = new World(wid, WorldType.CUBE, this);
        this._worlds.set(wid, w);

        return w;
    }

    getWorld(worldId) {
        if (!worldId) worldId = -1;
        return this._worlds.get(worldId);
    }

    getFreeWorld() {
        return this.getWorld(-1);
    }

}

export {WorldModel as default, WorldType, BlockType};
