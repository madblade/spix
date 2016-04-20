/**
 *
 */

'use strict';

import Flat3 from './flat3/game';

class GameFactory {

    static createGame(kind, gameId, connector) {
        var game;
        switch (kind) {
            case 'flat2':
                break;
            case 'flat3':
                game = new Flat3(gameId, connector);
                break;
            case 'free3':
                break;
            case 'free4':
                break;
            default: console.log("Unknown game kind requested @ GameFactory");
        }

        return game;
    }

}

export default GameFactory;
