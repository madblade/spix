/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../../math/collections/util';
import Factory from '../factory';

class Hub {

    constructor(app) {
        this._app = app;
        this._games = {};
    }

    validateUser(user) {
        // Do validation
        var res = user !== null;
        if (!res) console.log('Invalid user requested new game.');
        return res;
    }

    validateKind(kind) {
        var res = false;
        switch (kind) {
            case 'flat2': case 'flat3': case 'free3': case 'free4':
                res = true;
        }
        if (!res) console.log('Invalid game kind requested.');
        return res;
    }

    validateRequest() {
        // TODO think of different criteria
        var res = (CollectionUtils.numberOfProperties(this._games) < 1);
        if (!res) console.log('Invalid game creation request.');
        return res;
    }

    requestNewGame(user, kind) {
        if (!this.validateUser(user)) return;
        if (!this.validateKind(kind)) return;
        if (!this.validateRequest()) return;

        return this.addGame(kind);
    }

    /**
     * Not param-safe: use 'requestNewGame' to ensure kind validity.
     * @param kind
     * @returns {*}
     */
    addGame(kind) {
        // Init list of games of this kind
        if (!this._games[kind]) this._games[kind] = {};
        var gid = CollectionUtils.generateId(this._games[kind]);

        // Create matching game
        var game = Factory.createGame(kind, gid, this._app.connector);

        // Add to games.
        if (game) this._games[kind][gid] = game;

        return game;
    }

    endGame(game) {
        //delete this._games[game.gameId];
    }
}

export default Hub;
