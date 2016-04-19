/**
 *
 */

'use strict';

class GameFactory {

    // TODO instantiate games according to kind.
    static createGame(kind) {
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
            default: // Do not add game.
                throw "Unknown game kind requested @ GameFactory";
        }

        return game;
    }

    // TODO use custom player models
    static createPlayer(user, game) {

    }
}

export default GameFactory;
