/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../../engine/math/collections';
import Factory from '../factory';

class Hub
{
    constructor(app) {
        this._app = app;
        this._games = new Map();
    }

    static validateUser(user) {
        // Do validation
        let res = user !== null;
        if (!res) console.log('Invalid user requested new game.');
        return res;
    }

    static validateKind(kind) {
        switch (kind) {
            case 'cube': case 'flat': case 'demo':
                return true;
            case 'unstructured':
                console.log('[Server/Hub] Unstructured support coming soon.');
                return false;
        }
        console.log('[Server/Hub/Validator] Requested an unsupported game kind.');
        return false;
    }

    static validateOptions(kind, options) {
        let validated = false;
        switch (kind) {
            case 'demo':
                validated = !options; // Options must be null.
                break;
            case 'cube':
                validated = options.hasOwnProperty('hills') &&
                    (x => x >= 0 && x <= 1)(parseInt(options.hills, 10)) &&
                    options.hasOwnProperty('size') &&
                    (x => x >= 1 && x <= 256)(parseInt(options.size, 10));
                break;
            case 'flat':
                validated = options.hasOwnProperty('hills') &&
                    (x => x >= 0 && x <= 4)(parseInt(options.hills, 10)) &&
                    options.hasOwnProperty('caves') &&
                    (x => x >= 0 && x <= 1)(parseInt(options.caves, 10));
                break;
            case 'unstructured':
                validated = false;
                break;
        }
        if (!validated) console.error('[Server/Hub/Validator] Invalid game creation options.');
        return validated;
    }

    validateRequest() {
        // Count games.
        let games = this._games;

        let nbGames = 0;
        games.forEach(gamesForKind/*, kind*/ => {
            nbGames += gamesForKind.size;
        });

        const validation = nbGames < 5;
        console.log(nbGames > 0 ? nbGames : `No game${nbGames > 1 ? 's are' : ' is'} running or idle.`);
        if (!validation) console.error('[Server/Hub] Invalid game creation request: too many games running.');
        return validation;
    }

    requestNewGame(user, kind, options) {
        let app = this._app;

        // Verify.
        if (!Hub.validateUser(user)) return false;
        if (!Hub.validateKind(kind)) return false;
        if (!Hub.validateOptions(kind, options)) return false;
        if (!this.validateRequest()) return false;

        // Create game and notify users.
        const id = this.addGame(kind, options);
        if (id || id === 0) {
            app.connection.db.notifyGameCreation(kind, id);
            return true;
        } else return false;
    }

    getGame(kind, gameId) {
        let gamesOfKind = this._games.get(kind);
        if (!gamesOfKind) return;
        return gamesOfKind.get(gameId);
    }

    /**
     * Lists all games with minimal information.
     * @returns {{}} Object: 1 id = 1 game kind; 1 element = 1 array of game ids.
     */
    listGames() {
        let games = {};
        let modelGames = this._games;

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
    addGame(kind, options) {
        let games = this._games;
        let connection = this._app.connection;

        // Init list of games of this kind
        if (!games.has(kind)) games.set(kind, new Map());
        let gid = CollectionUtils.generateId(games.get(kind));

        // Create matching game
        let game = Factory.createGame(this, kind, gid, connection, options);

        // Add to games.
        if (game) {
            games.get(kind).set(gid, game);
            return game.gameId;
        } else {
            return null;
        }
    }

    endGame(game) {
        if (game.isRunning) {
            console.log('WARN! Trying to end a running game. Abort.');
            return;
        }

        let games = this._games;
        let gid = game.gameId;
        let kind = game.kind;

        game.destroy();
        let gamesOfKind = games.get(kind);
        if (gamesOfKind) {
            gamesOfKind.delete(gid);
            if (gamesOfKind.size < 1) games.delete(kind);
        }
    }
}

export default Hub;
