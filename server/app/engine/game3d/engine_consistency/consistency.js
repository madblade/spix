/**
 *
 */

'use strict';

import Generator        from './generator/generator';
import Builder          from './builder/builder';
import Loader           from './loader/loader';

class ConsistencyEngine {

    constructor(game) {
        // Models.
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        this._xModel        = game.xModel;

        // Engine.
        this._generator     = new Generator(this);
        this._builder       = new Builder(this);
        this._loader        = new Loader(this);
    }

    update() {

    }

    //extractChunksForNewPlayer(player) {
    //    return ExtractionAPI.computeChunksForNewPlayer(player, this);
    //}

}

export default ConsistencyEngine;
