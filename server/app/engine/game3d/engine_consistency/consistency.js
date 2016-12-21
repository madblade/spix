/**
 *
 */

'use strict';

import Generator        from './generator/generator';
import Builder          from './builder/builder';
import Loader           from './loader/loader';

import ChunkBuffer      from './buffer_chunk';
import EntityBuffer     from './buffer_entity';

class ConsistencyEngine {

    constructor(game) {
        // Models.
        this._entityModel       = game.entityModel;
        this._worldModel        = game.worldModel;
        this._xModel            = game.xModel;
        this._consistencyModel  = game.consistencyModel;

        // Engine.
        this._generator         = new Generator(this);
        this._builder           = new Builder(this);
        this._loader            = new Loader(this);

        // Buffers.
        this._chunkBuffer       = new ChunkBuffer();
        this._entityBuffer      = new EntityBuffer();
    }

    get worldModel()            { return this._worldModel; }
    get entityModel()           { return this._entityModel; }
    get consistencyModel()      { return this._consistencyModel; }

    update() {

    }

    initChunkOutputForPlayer(player) {
        return this._builder.computeChunksForNewPlayer(player);
    }

    getChunkOutputForPlayer(player) {
        // TODO [CRIT] put in update.
        return this._builder.computeNewChunksInRangeForPlayer(player);
    }

    getEntityOutputForPlayer(player) {
        return this._loader.computeEntitiesInRange(player);
    }

    setChunksAsLoaded(player, chunks) {
        let a = player.avatar;
        let cs = this._worldModel.allChunks;

        for (let cid in chunks)
            if (cs.has(cid)) this._consistencyModel.setChunkLoaded(a.id, cid);
    }

    setEntitiesAsLoaded(player, entities) {
        let a = player.avatar;
        let es = this._entityModel.entities;

        for (let eid in entities)
            if (es.hasOwnProperty(eid)) this._consistencyModel.setEntityLoaded(a.id, eid);
    }
}

export default ConsistencyEngine;
