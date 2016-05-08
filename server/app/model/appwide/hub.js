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

    static validateUser(user) {
        // Do validation
        var res = user !== null;
        if (!res) console.log('Invalid user requested new game.');
        return res;
    }

    static validateKind(kind) {
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
        var nbGames = CollectionUtils.numberOfNestedProperties(this._games);
        var res = nbGames < 5;
        console.log(nbGames + ' game' + (nbGames>1?'s are':' is') + ' running or idle.');
        if (!res) console.log('Invalid game creation request.');
        return res;
    }

    requestNewGame(user, kind) {
        if (!Hub.validateUser(user)) return false;
        if (!Hub.validateKind(kind)) return false;
        if (!this.validateRequest()) return false;

        this.addGame(kind);
        return true;
    }

    getGame(kind, gameId) {
        return this._games[kind][gameId];
    }

    /**
     * Lists all games with minimal information.
     * @returns {{}} Object: 1 id = 1 game kind; 1 element = 1 array of game ids.
     */
    listGames() {
        var games = {};
        var f = (kind) => (g) => games[kind].push(g);
        for (var kind in this._games) {
            if (!this._games.hasOwnProperty(kind)) continue;
            games[kind] = [];
            CollectionUtils.forEachProperty(this._games[kind], f(kind));
        }
        return games;
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
        var game = Factory.createGame(this, kind, gid, this._app.connector);

        // Add to games.
        if (game) this._games[kind][gid] = game;

        return game.gameId;
    }

    endGame(game) {
        if (game.isRunning) {
            console.log("WARN! Trying to end a running game. Abort.");
            return;
        }

        var gid = game.gameId;
        var kind = game.kind;
        game.destroy();
        delete this._games[kind][gid];
    }

}

export default Hub;
