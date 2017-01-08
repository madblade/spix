/**
 *
 */

'use strict';

import ChunkBuffer      from './buffer_chunk';
import EntityBuffer     from './buffer_entity';

import ChunkLoader      from './loader/loader_chunk';
import EntityLoader     from './loader/loader_entity';

import Generator        from './generator/generator';
import Updater          from './updater/updater';

class ConsistencyEngine {

    constructor(game) {
        this._game = game;

        // Models.
        this._entityModel       = game.entityModel;
        this._worldModel        = game.worldModel;
        this._xModel            = game.xModel;
        this._consistencyModel  = game.consistencyModel;

        // Buffers.
        this._chunkBuffer       = new ChunkBuffer();
        this._entityBuffer      = new EntityBuffer();

        // Other engines.
        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;

        // Internal engine.
        this._generator         = new Generator(this);
        this._chunkLoader       = new ChunkLoader(this);
        this._entityLoader      = new EntityLoader(this);
        this._updater           = new Updater(this);
    }

    get game()                  { return this._game; }
    get worldModel()            { return this._worldModel; }
    get entityModel()           { return this._entityModel; }
    get xModel()                { return this._xModel; }
    get consistencyModel()      { return this._consistencyModel; }

    get physicsEngine()         { return this._physicsEngine; }
    get chunkBuffer()           { return this._chunkBuffer; }
    get entityBuffer()          { return this._entityBuffer; }
    get chunkLoader()           { return this._chunkLoader; }
    get entityLoader()          { return this._entityLoader; }

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

    addInput(meta, avatar) {
        this._updater.addInput(meta, avatar);
    }

    update() {
        this._updater.update();
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

    getXOutput() {
        return this._updater.getOutput();
    }

    flushBuffers() {
        this._chunkBuffer.flush();
        this._entityBuffer.flush();
        this._updater.flushBuffers();
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
