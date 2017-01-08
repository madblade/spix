/**
 *
 */

'use strict';

class Updater {

    constructor(consistencyEngine) {
        // Model.
        this._game = consistencyEngine.game;
        this._worldModel = consistencyEngine.worldModel;
        this._consistencyModel = consistencyEngine.consistencyModel;

        // Engine.
        this._physicsEngine = consistencyEngine.physicsEngine;
        this._chunkBuffer = consistencyEngine.chunkBuffer;
        this._entityBuffer = consistencyEngine.entityBuffer;
        this._chunkLoader = consistencyEngine.chunkLoader;
        this._entityLoader = consistencyEngine.entityLoader;
    }

    static bench = false;

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
            if (Updater.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Entities.');
            t = process.hrtime();

            // Compute change for chunks in range.
            let addedChunks, removedChunks,
                v = cLoader.computeNewChunksInRange(p);
            if (v) [addedChunks, removedChunks] = v;

            dt1 = (process.hrtime(t)[1]/1000);
            if (Updater.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Chunks.');
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

}

export default Updater;
