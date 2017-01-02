/**
 *
 */

'use strict';

import ChunkLoader      from './loader/loader_chunk';
import EntityLoader     from './loader/loader_entity';

import Generator        from './generator/generator';

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

        // Other engines.
        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;

        // Internal engine.
        this._generator         = new Generator(this);
        this._chunkLoader       = new ChunkLoader(this);
        this._entityLoader      = new EntityLoader(this);

        // Buffers.
        this._chunkBuffer       = new ChunkBuffer();
        this._entityBuffer      = new EntityBuffer();
    }

    get worldModel()            { return this._worldModel; }
    get entityModel()           { return this._entityModel; }
    get consistencyModel()      { return this._consistencyModel; }

    static bench = false;

    // On connection / disconnection.
    spawnPlayer(player) {
        this._entityModel.spawnPlayer(player);
        this._consistencyModel.spawnPlayer(player);
        this._entityBuffer.spawnPlayer(player);
    }

    despawnPlayer(playerId) {
        this._entityBuffer.removePlayer(playerId);
        this._consistencyModel.removePlayer(playerId);
        this._entityModel.removePlayer(playerId);
    }

    // This only takes care of LOADING things with respect to players.
    // (entities, chunks)
    // The Output class directly manages CHANGING things.
    // (it gets outputs from TopologyEngine and PhysicsEngine, then transmits them to players)
    // Loading and unloading objects is done exclusively here.
    // Single criterion for maintaining loaded objects consistent: distance.
    // (objects are initialized with STATES so they don't need updates)
    update() {
        let players = this._game.players;

        // Get buffers.
        let cbuf = this._chunkBuffer;
        let ebuf = this._entityBuffer;

        // Model and engines.
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;
        let updatedEntities = this._physicsEngine.getOutput();
        let addedPlayers = this._entityBuffer.addedPlayers;
        let removedPlayers = this._entityBuffer.removedPlayers;

        // Loaders
        let eLoader = this._entityLoader;
        let cLoader = this._chunkLoader;

        // Object iterator.
        let forEach = (object, callback) => { for (let id in object) { callback(id) } };

        // For each player...
        let t = process.hrtime();
        let dt1;
        players.forEach(p => { if (p.avatar) {

            let pid = p.avatar.id;

            // Compute change for entities in range.
            let addedEntities, removedEntities,
                u = eLoader.computeNewEntitiesInRange(p, consistencyModel, updatedEntities, addedPlayers, removedPlayers);

            if (u) [addedEntities, removedEntities] = u;
            // TODO [MEDIUM] filter: updated entities and entities that enter in range.

            dt1 = (process.hrtime(t)[1]/1000);
            if (ConsistencyEngine.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Entities.');
            t = process.hrtime();

            // Compute change for chunks in range.
            let addedChunks, removedChunks,
                v = cLoader.computeNewChunksInRange(p);
            if (v) [addedChunks, removedChunks] = v;

            dt1 = (process.hrtime(t)[1]/1000);
            if (ConsistencyEngine.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Chunks.');
            t = process.hrtime();

            // Update consistency model.
            // WARN: updates will only be transmitted during next output pass.
            // BE CAREFUL HERE
            if (addedEntities)      forEach(addedEntities, e => consistencyModel.setEntityLoaded(pid, parseInt(e)));
            if (removedEntities)    forEach(removedEntities, e => consistencyModel.setEntityOutOfRange(pid, parseInt(e)));
            if (addedChunks)        forEach(addedChunks, wid => {
                                        forEach(addedChunks[wid], c => {consistencyModel.setChunkLoaded(pid, parseInt(wid), c)});
                                    }) ;
            if (removedChunks)      forEach(removedChunks, wid => {
                                        forEach(removedChunks[wid], c => consistencyModel.setChunkOutOfRange(pid, parseInt(wid), c))
                                    });


            // Update output buffers.
            if (addedChunks || removedChunks)
                cbuf.updateChunksForPlayer(pid, addedChunks, removedChunks);
            if (addedEntities || removedEntities)
                ebuf.updateEntitiesForPlayer(pid, addedEntities, removedEntities);
        }});
    }

    getChunkOutput() {
        return this._chunkBuffer.getOutput();
    }

    getEntityOutput() {
        return this._entityBuffer.getOutput();
    }

    getPlayerOutput() {
        return this._entityBuffer.addedPlayers;
    }

    flushBuffers() {
        this._chunkBuffer.flush();
        this._entityBuffer.flush();
    }

    // The first time, FORCE BUILD when output requests CE initial output.
    initChunkOutputForPlayer(player) {
        let aid = player.avatar.id;
        let worldId = player.avatar.worldId;
        let world = this._worldModel.getWorld(worldId);

        let cs = world.allChunks;
        let cm = this._consistencyModel;

        // Object.
        var chunkOutput = this._chunkLoader.computeChunksForNewPlayer(player);

        for (let wid in chunkOutput) {
            let chunkIds = chunkOutput[wid];
            for (let cid in chunkIds)
                if (cs.has(cid)) cm.setChunkLoaded(aid, parseInt(wid), cid);
        }

        // WARN: idem, updates must be transmitted right after this call
        // otherwise its player will be out of sync.
        return chunkOutput;
    }

    // The first time, FORCE COMPUTE in-range entities when output requests CE output.
    initEntityOutputForPlayer(player) {
        let aid = player.avatar.id;
        let es = this._entityModel.entities;
        let cm = this._consistencyModel;

        // Object.
        var entityOutput = this._entityLoader.computeEntitiesInRange(player);

        for (let eid in entityOutput)
            if (es.has(eid)) cm.setEntityLoaded(aid, eid);

        // Updates must be transmitted after this call.
        return entityOutput;
    }

    generateWorld() {
        return this._generator.generateWorld();
    }

}

export default ConsistencyEngine;
