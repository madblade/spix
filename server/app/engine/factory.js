/**
 *
 */

'use strict';

import Game3D from './game3d/game';

class GameFactory {

    static createGame(hub, kind, gameId, connector, options)
    {
        console.log('got options:');
        console.log(options);
        // TODO apply options
        let game;
        switch (kind) {
            case 'flat':
                break;
            case 'cube':
                game = new Game3D(hub, gameId, connector);
                break;
            default: console.log('Unknown game kind requested @ GameFactory.');
        }

        return game;
    }

}

export default GameFactory;
