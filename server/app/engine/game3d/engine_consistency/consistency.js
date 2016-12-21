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
        this._game = game;

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

    // This only takes care of LOADING things with respect to players.
    // (entities, chunks)
    // The Output class directly manages CHANGING things.
    // (it gets outputs from TopologyEngine and PhysicsEngine, then transmits them to players)
    // Loading and unloading objects is done exclusively here.
    // Single criterion for maintaining loaded objects consistent: distance.
    // (objects are initialized with STATES so they don't need updates)
    update() {
        // TODO [CRIT] implement
        let players = this._game.players;

        // Get updated entities.

        // For each player...
        players.forEach(p => {
            // Compute change in entities in range.
            // Compute change in chunks in range.
            // Update consistency model.
            // Update output buffer
        });
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
