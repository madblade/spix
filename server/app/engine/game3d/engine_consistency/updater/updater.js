/**
 *
 */

'use strict';

import XUpdater from './updater_x';
import XLoader  from '../loader/loader_x';
import XBuffer  from '../buffer_x';
import TimeUtils from '../../../math/time';

class Updater {

    constructor(consistencyEngine)
    {
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
        let buffer = this._inputBuffer;
        let xUpdater = this._xUpdater;

        buffer.forEach(x => {
            // console.log(x[0]); // Avatar
            console.log(x[1]); // { action: 'gate', meta: [ 'add', -2, 6, -16, portalToLinkId ] }
            xUpdater.update(x[0], x[1]);
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
        let forEach = (object, callback) => { for (let id in object) { callback(id); } };

        // For each player...
        let t = TimeUtils.getTimeSecNano();
        let dt1;
        let debugThresh = 1000;
        // TODO [OPT] use arrays
        players.forEach(p => { if (p.avatar)
        {
            let pid = p.avatar.entityId;

            // Compute change for entities in range.
            // TODO [CRIT] heavily optimize by adding data
            let addedEntities;
            let removedEntities;
            let u = eLoader.computeNewEntitiesInRange(p, updatedEntities, addedPlayers, removedPlayers);

            if (u) [addedEntities, removedEntities] = u;
            // TODO [MEDIUM] filter: updated entities and entities that enter in range.

            dt1 = TimeUtils.getTimeSecNano(t)[1] / 1000;
            if (Updater.bench && dt1 > debugThresh) console.log(`\t${dt1} computeNew Entities.`);
            t = TimeUtils.getTimeSecNano();

            // Compute change for chunks in range.
            let addedChunks;
            let removedChunks;
            let v = cLoader.computeNewChunksInRange(p);
            if (v) [addedChunks, removedChunks] = v;

            dt1 = TimeUtils.getTimeSecNano(t)[1] / 1000;
            if (Updater.bench && dt1 > debugThresh) console.log(`\t${dt1} computeNew Chunks.`);
            t = TimeUtils.getTimeSecNano();

            let addedX;
            let removedX;
            let addedW;
            let addedWMeta;
            let x = xLoader.computeNewXInRange(p);
            if (x) [addedX, removedX] = x;

            // Update consistency model.
            // WARN: updates will only be transmitted during next output pass.
            // BE CAREFUL HERE
            if (addedEntities)      forEach(addedEntities, e => consistencyModel.setEntityLoaded(pid, parseInt(e, 10)));
            if (removedEntities)    forEach(removedEntities, e => consistencyModel.setEntityOutOfRange(pid, parseInt(e, 10)));

            if (addedX)             forEach(addedX, ax => consistencyModel.setXLoaded(pid, parseInt(ax, 10)));
            if (removedX)           forEach(removedX, ax => consistencyModel.setXOutOfRange(pid, parseInt(ax, 10)));

            if (addedChunks)        {
                addedW = {};
                addedWMeta = {};
                forEach(addedChunks, wid => {
                    if (!(wid in addedW)) {
                        let w = worldModel.getWorld(parseInt(wid, 10));
                        addedW[wid] = [w.xSize, w.ySize, w.zSize];
                        if (!consistencyModel.hasWorld(wid)) {
                            addedWMeta[wid] = [w.worldInfo.type, w.worldInfo.radius, w.worldInfo.center.x, w.worldInfo.center.y, w.worldInfo.center.z];
                        }
                    }
                    forEach(addedChunks[wid], c => {
                        consistencyModel.setChunkLoaded(pid, parseInt(wid, 10), c);
                    });
                });
            }
            if (removedChunks)
                forEach(removedChunks, wid => {
                    forEach(removedChunks[wid], c =>
                        consistencyModel.setChunkOutOfRange(pid, parseInt(wid, 10), c));
                });

            // TODO [OPT] pack everything in just one send
            // Update output buffers.
            if (addedChunks || removedChunks)
                cbuf.updateChunksForPlayer(pid, addedChunks, removedChunks, addedW, addedWMeta);
            if (addedEntities || removedEntities)
                ebuf.updateEntitiesForPlayer(pid, addedEntities, removedEntities);
            if (addedX || removedX)
                xbuf.updateXForPlayer(pid, addedX, removedX);
        }});
    }

}

export default Updater;
