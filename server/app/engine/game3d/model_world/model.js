/**
 *
 */

'use strict';

import World from './world';
import CollectionUtils from '../../math/collections';

class WorldModel {

    static serverLoadingRadius = 5;

    constructor(game) {
        this._game = game;

        this._worlds = new Map();

        this._worlds.set(-1, new World(-1, this));
    }

    addWorld() {

    }

    getWorld(worldId) {
        if (!worldId) worldId = -1;
        return this._worlds.get(worldId);
    }

}

export default WorldModel;
