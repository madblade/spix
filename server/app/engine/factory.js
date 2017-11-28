/**
 *
 */

'use strict';

import Game3D from './game3d/game';

class GameFactory {

    static createGame(hub, kind, gameId, connector) {
        let game;
        switch (kind) {
            case 'game2d':
                break;
            case 'game3d':
                game = new Game3D(hub, gameId, connector);
                break;
            default: console.log('Unknown game kind requested @ GameFactory.');
        }

        return game;
    }

}

export default GameFactory;
