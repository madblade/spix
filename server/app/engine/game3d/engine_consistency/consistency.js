/**
 *
 */

'use strict';

import Generator        from './generator/generator';
import Builder          from './builder/builder';
import Loader           from './loader/loader';

import ConsistencyModel from '../model_consistency/model';

class ConsistencyEngine {

    constructor(game) {
        // Models.
        this._entityModel       = game.entityModel;
        this._worldModel        = game.worldModel;
        this._xModel            = game.xModel;

        // Custom model.
        this._consistencyModel  = new ConsistencyModel(game);

        // Engine.
        this._generator         = new Generator(this);
        this._builder           = new Builder(this);
        this._loader            = new Loader(this);
    }

    get worldModel()  { return this._worldModel; }
    get entityModel() { return this._entityModel; }

    update() {

    }

    loadChunksForNewPlayer(player) {
        return this._builder.computeChunksForNewPlayer(player);
    }

    extractNewChunksInRangeForPlayer(player) {
        return this._builder.computeNewChunksInRangeForPlayer(player);
    }

    extractEntitiesInRange(player) {
        return this._loader.computeEntitiesInRange(player);
    }

    setChunksAsLoaded(player, chunks) {
        let a = player.avatar;
        let cs = this._worldModel.allChunks;

        for (let cid in chunks)
            if (cs.has(cid)) a.setChunkAsLoaded(cid);
    }

    setEntitiesAsLoaded(player, entities) {
        let a = player.avatar;
        let es = this._entityModel.entities;

        for (let eid in entities)
            if (es.hasOwnProperty(eid)) a.setEntityAsLoaded(eid);
    }
}

export default ConsistencyEngine;
