/**
 * Processing and model transformations.
 */

'use strict';

import Hub from 'model/hub';
import Flat3 from './flat3/game';

class Engine {

    constructor(app) {
        this._app = app;
        this._hub = new Hub();
    }

    _validate(kind) {
        return ['flat2', 'flat3', 'free3', 'free4'].include(kind);
    }

    addGame(kind) {
        if (!this._validate(kind)) return;

        // Create game
        var game;
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
                console.err("Invalid game kind @ engine.addGame");
                return;
        }

        game.kind = kind;
        this._hub.addGame(game);
    }

}

export default Engine;
