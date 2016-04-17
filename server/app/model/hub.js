/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../math/collections/util';

class Hub {

    constructor() {
        this._games = {};
    }

    endGame() {

    }

    addGame(game) {
        var kind = game.kind;

        // Init list of games of this kind
        if (!this._games[kind]) this._games[kind] = {};
        game.gid = CollectionUtils.generateId(this._games[kind]);

        // Add to games.
        this.games[kind][game.gid] = game;
    }

}

export default Hub;
