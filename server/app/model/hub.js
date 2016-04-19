/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../math/collections/util';
import Flat3 from '../engine/flat3/game';

class Hub {

    constructor(app) {
        this._app = app;
        this._games = {};
    }

    endGame(game) {
        //delete this._games[game.gameId];
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
        if (!this.validateUser(user)) return null; // TODO Exception
        if (!this.validateKind(kind)) return null;
        return this.addGame(kind);
    }

    addGame(kind) {
        // Create matching game
        var game;

        // Init list of games of this kind
        if (!this._games[kind]) this._games[kind] = {};
        var gid = CollectionUtils.generateId(this._games[kind]);

        switch (kind) {
            case 'flat2':
                break;
            case 'flat3':
                game = new Flat3(gid, this._app.connector);
                break;
            case 'free3':
                break;
            case 'free4':
                break;
            default:
                // Do not add game.
                console.log("Invalid game kind @ engine.addGame"); // TODO Exceptions
                return null;
        }

        // Add to games.
        this._games[kind][gid] = game;

        return game;
    }

}

export default Hub;
