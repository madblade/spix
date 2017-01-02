/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../../engine/math/collections';
import Factory from '../factory';

class Hub {

    constructor(app) {
        this._app = app;
        //this._games = {};
        this._games = new Map();
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
            case 'game3d': case 'game2d':
                res = true;
        }
        if (!res) console.log('Invalid game kind requested.');
        return res;
    }

    validateRequest() {
        // TODO [LOW] think of different criteria
        // Count games.
        //var nbGames = CollectionUtils.numberOfNestedProperties(this._games);
        let games = this._games;

        let nbGames = 0;
        games.forEach((gamesForKind, kind) => {
            nbGames += gamesForKind.size;
        });

        const validation = nbGames < 5;
        console.log(nbGames>0?nbGames:'No' + ' game' + (nbGames>1?'s are':' is') + ' running or idle.');
        if (!validation) console.log('Invalid game creation request.');
        return validation;
    }

    requestNewGame(user, kind) {
        let app = this._app;

        // Verify.
        if (!Hub.validateUser(user)) return false;
        if (!Hub.validateKind(kind)) return false;
        if (!this.validateRequest()) return false;

        // Create game and notify users.
        const id = this.addGame(kind);
        app.connection.db.notifyGameCreation(kind, id);

        return true;
    }

    getGame(kind, gameId) {
        //return this._games[kind][gameId];
        let gamesOfKind = this._games.get(kind);
        return gamesOfKind.get(gameId);
    }

    /**
     * Lists all games with minimal information.
     * @returns {{}} Object: 1 id = 1 game kind; 1 element = 1 array of game ids.
     */
    listGames() {
        let games = {};
        let modelGames = this._games;

        //var f = kind => gid => {
            //if (this._games[kind][gid].ready) games[kind].push(gid);
        //};

        //for (let kind in this._games) {
        //    games[kind] = [];
        //    CollectionUtils.forEachProperty(this._games[kind], f(kind));
        //}

        modelGames.forEach((gamesForKind, kind) => {
            games[kind] = [];
            let g = games[kind];
            gamesForKind.forEach((game, gameId) => {
                g.push(gameId);
            });
        });

        return games;
    }

    /**
     * Not param-safe: use 'requestNewGame' to ensure kind validity.
     * @param kind
     * @returns {*}
     */
    addGame(kind) {
        let games = this._games;
        let connection = this._app.connection;

        // Init list of games of this kind
        //if (!this._games[kind]) this._games[kind] = {};
        if (!games.has(kind)) games.set(kind, new Map());
        //var gid = CollectionUtils.generateId(this._games[kind]);
        let gid = CollectionUtils.generateId(games.get(kind));

        // Create matching game
        var game = Factory.createGame(this, kind, gid, connection);

        // Add to games.
        //if (game) this._games[kind][gid] = game;
        if (game) games.get(kind).set(gid, game);

        return game.gameId;
    }

    endGame(game) {
        if (game.isRunning) {
            console.log("WARN! Trying to end a running game. Abort.");
            return;
        }

        let games = this._games;
        let gid = game.gameId;
        let kind = game.kind;

        game.destroy();
        // delete this._games[kind][gid];
        let gamesOfKind = games.get(kind);
        gamesOfKind.delete(gid);
        if (gamesOfKind.size < 1) games.delete(kind);
    }

}

export default Hub;
