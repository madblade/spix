/**
 * Game management.
 */

'use strict';

import CollectionUtils from '../../math/collections/util';

import Flat3 from '../flat3/game';

class Hub {

    constructor() {
        this._games = {};
    }

    _validate(kind) {
        return ['flat2', 'flat3', 'free3', 'free4'].include(kind);
    }

    addGame(kind) {
        if (!this._validate(kind)) return;

        // Init list of games of this kind
        if (!this._games[kind]) this._games[kind] = [];
        var gid = CollectionUtils.generateId(this._games[kind]);

        var game;
        switch (kind) {
            case 'flat2':
                break;
            case 'flat3':
                game = new Flat3(gid);
                break;
            case 'free3':
                break;
            case 'free4':
                break;
            default:
                break;
        }


        this.games.push(game);
    }

}

export default Hub;
