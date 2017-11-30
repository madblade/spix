/**
 *
 */

'use strict';

import World from './world';
import CollectionUtils from '../../math/collections';

class WorldModel {

    static serverLoadingRadius = 2;

    constructor(game) {
        this._game = game;

        this._worlds = new Map();

        this._worlds.set(-1, new World(-1, this));
    }

    get worlds() { return this._worlds; }

    addWorld(worldId) {
        let wid  = worldId || CollectionUtils.generateId(this._worlds);

        if (this._worlds.has(wid)) return;
        let w = new World(wid, this);
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

export default WorldModel;
