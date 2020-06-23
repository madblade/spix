/**
 *
 */

'use strict';

import Game3D, { GameType } from './game3d/game';

class GameFactory
{
    static createGame(hub, kind, gameId, connector, options)
    {
        let game;
        const isServerLocal = hub._isServerLocal();
        switch (kind) {
            case 'flat':
                let flatHillsType = parseInt(options.hills, 10);
                let trees = parseInt(options.trees, 10);
                game = new Game3D(hub, gameId, connector, { kind: GameType.FLAT, flatHillsType, trees }, isServerLocal);
                break;
            case 'cube':
                let threeHillsType = parseInt(options.hills, 10);
                let size = parseInt(options.size, 10);
                game = new Game3D(hub, gameId, connector, { kind: GameType.CUBE, threeHillsType, size }, isServerLocal);
                break;
            case 'demo':
                game = new Game3D(hub, gameId, connector, { kind: GameType.DEMO }, isServerLocal);
                break;
            case 'fantasy':
                game = new Game3D(hub, gameId, connector, { kind: GameType.FANTASY }, isServerLocal);
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
