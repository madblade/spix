/**
 *
 */

'use strict';

import XUpdater from './updater_x';
import XLoader  from '../loader/loader_x';
import XBuffer  from '../buffer_x';

class Updater {

    constructor(consistencyEngine) {

        // Model.
        this._game              = consistencyEngine.game;
        this._worldModel        = consistencyEngine.worldModel;
        this._consistencyModel  = consistencyEngine.consistencyModel;

        // Engine.
        this._physicsEngine     = consistencyEngine.physicsEngine;
        this._chunkBuffer       = consistencyEngine.chunkBuffer;
        this._entityBuffer      = consistencyEngine.entityBuffer;
        this._chunkLoader       = consistencyEngine.chunkLoader;
        this._entityLoader      = consistencyEngine.entityLoader;

        // xEngine.
        this._xUpdater          = new XUpdater(consistencyEngine);
        this._xLoader           = new XLoader(consistencyEngine);
        this._xBuffer           = new XBuffer();

        // X creation/deletion buffer.
        this._inputBuffer       = [];
    }

    static bench = false;

    addInput(meta, avatar) {
        this._inputBuffer.push([avatar, meta]);
    }

    update() {
        // User-send updates (mainly x).
        this.processBuffer();

        // Compute aggregates to send.
        this.updateConsistency();
    }

    processBuffer() {
        var buffer = this._inputBuffer;
        var xUpdater = this._xUpdater;

        buffer.forEach(x => {
            // console.log(x[0]); // Avatar
            console.log(x[1]); // { action: 'gate', meta: [ 'add', -2, 6, -16, portalToLinkId ] }
            xUpdater.update(x[0], x[1])
        });

        // Flush X INPUT (BEFORE SEND UPDATE).
        this._inputBuffer = [];
    }

    // Get X output
    getOutput() {
        return this._xBuffer.getOutput();
    }

    // Flush X OUTPUT (AFTER SEND UPDATER).
    flushBuffers() {
        this._xBuffer.flush();
    }

    // This only takes care of LOADING things with respect to players.
    // (entities, chunks)
    // The Output class directly manages CHANGING things.
    // (it gets outputs from TopologyEngine and PhysicsEngine, then transmits them to players)
    // Loading and unloading objects is done exclusively here.
    // Single criterion for maintaining loaded objects consistent: distance.
    // (objects are initialized with STATES so they don't need updates)
    updateConsistency() {
        let players = this._game.players;

        // Get buffers.
        let cbuf = this._chunkBuffer;
        let ebuf = this._entityBuffer;
        let xbuf = this._xBuffer;

        // Model and engines.
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;
        let updatedEntities = this._physicsEngine.getOutput();
        let addedPlayers = this._entityBuffer.addedPlayers;
        let removedPlayers = this._entityBuffer.removedPlayers;

        // Loaders
        let eLoader = this._entityLoader;
        let cLoader = this._chunkLoader;
        let xLoader = this._xLoader;

        // Object iterator.
        let forEach = (object, callback) => { for (let id in object) { callback(id) } };

        // For each player...
        let t = process.hrtime();
        let dt1;
        players.forEach(p => { if (p.avatar) {

            let pid = p.avatar.id;

            // Compute change for entities in range.
            let addedEntities, removedEntities,
                u = eLoader.computeNewEntitiesInRange(p, updatedEntities, addedPlayers, removedPlayers);

            if (u) [addedEntities, removedEntities] = u;
            // TODO [MEDIUM] filter: updated entities and entities that enter in range.

            dt1 = (process.hrtime(t)[1]/1000);
            if (Updater.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Entities.');
            t = process.hrtime();

            // Compute change for chunks in range.
            let addedChunks, removedChunks,
                v = cLoader.computeNewChunksInRange(p);
            if (v) [addedChunks, removedChunks] = v;

            dt1 = (process.hrtime(t)[1]/1000);
            if (Updater.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Chunks.');
            t = process.hrtime();

            let addedX, removedX,
                x = xLoader.computeNewXInRange(p);
            if (x) [addedX, removedX] = x;

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

            if (addedX)             forEach(addedX, x => consistencyModel.setXLoaded(pid, parseInt(x)));
            if (removedX)           forEach(removedX, x => consistencyModel.setXOutOfRange(pid, parseInt(x)));


            // Update output buffers.
            if (addedChunks || removedChunks)
                cbuf.updateChunksForPlayer(pid, addedChunks, removedChunks);
            if (addedEntities || removedEntities)
                ebuf.updateEntitiesForPlayer(pid, addedEntities, removedEntities);
            if (addedX || removedX)
                xbuf.updateXForPlayer(pid, addedX, removedX);
        }});
    }

}

export default Updater;
