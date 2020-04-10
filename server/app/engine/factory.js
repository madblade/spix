/**
 *
 */

'use strict';

import Game3D from './game3d/game';

class GameFactory
{
    static createGame(hub, kind, gameId, connector, options)
    {
        console.log('got options:');
        console.log(options);
        // TODO apply options
        let game;
        switch (kind) {
            case 'flat':
                let flatHillsType = parseInt(options.hills, 10);
                let caves = parseInt(options.caves, 10);
                game = new Game3D(hub, gameId, connector);
                break;
            case 'cube':
                let threeHillsType = parseInt(options.hills, 10);
                let size = parseInt(options.hills, 10);
                game = new Game3D(hub, gameId, connector);
                break;
            case 'demo':
                game = new Game3D(hub, gameId, connector);
                break;
            case 'unstructured':
                console.log('[Server/GameFactory] Unstructured not yet supported.');
                return;
            default:
                console.error('[Server/GameFactory] Unknown game kind requested.');
                return;
        }

        return game;
    }
}

export default GameFactory;
