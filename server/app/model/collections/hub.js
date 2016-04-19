/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../../math/collections/util';
import Flat3 from '../../engine/flat3/game';
import Factory from '../factory';

class Hub {

    constructor(app) {
        this._app = app;
        this._games = {};
    }

    validateUser(user) {
        // Do validation
        return user !== null;
    }

    validateKind(kind) {
        switch (kind) {
            case 'flat2': case 'flat3': case 'free3': case 'free4':
                return true;
            default:
                return false;
        }
    }

    requestNewGame(user, kind) {
        if (!this.validateUser(user)) throw 'Invalid user requested new game.';
        if (!this.validateKind(kind)) throw 'Invalid game kind requested.';
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
