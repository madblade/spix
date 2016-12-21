/**
 *
 */

'use strict';

class UserOutput {

    static debug = false;

    constructor(game) {
        this._game = game;

        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;
        this._consistencyEngine = game.consistencyEngine;
    }

    static pack(message) {
        return JSON.stringify(message);
    }

    init(player) {
        let game = this._game;
        let p = player;
        let a = p.avatar;

        let consistencyEngine = this._consistencyEngine;

        // Load chunks.
        let chunks = consistencyEngine.initChunkOutputForPlayer(p);
        p.send('chk', UserOutput.pack(chunks));
        consistencyEngine.setChunksAsLoaded(p, chunks);

        // Load entities.
        let entities = consistencyEngine.initEntityOutputForPlayer(p);
        p.send('ent', UserOutput.pack([a.position, a.rotation, entities]));
        consistencyEngine.setEntitiesAsLoaded(p, entities);

        if (UserOutput.debug) console.log('Init a new player on game ' + game.gameId + '.');
    }

    update() {
        // Idea: defer updates if perf. pb
        //let time = process.hrtime();
        this.updateChunks();
        //let t1 = (process.hrtime(time)[1]/1000);
        //if (t1 > 100) console.log(t1 + " µs to update chks.");

        this.updateEntities();

        //let time2 = process.hrtime();
        this.updateMeta();
        //let t2 = (process.hrtime(time2)[1]/1000);
        //if (t2 > 1000) console.log(t2 + " µs to update etts.");

        this._consistencyEngine.flushBuffers();
    }

    updateChunks() {
        let game              = this._game;
        let topologyEngine    = this._topologyEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedChunks = topologyEngine.getOutput();
        let consistencyOutput = consistencyEngine.getChunkOutput();

        game.players.forEach(p => {
            let hasNew, hasUpdated;
            let pid = p.avatar.id;

            // TODO [LOW] check 'player has updated position'
            // TODO [MEDIUM] dynamically remove chunks with GreyZone, serverside
            let addedOrRemovedChunks = consistencyOutput.get(pid);
            hasNew = (addedOrRemovedChunks && Object.keys(addedOrRemovedChunks).length > 0);

            let updatedChunksForPlayer = topologyEngine.getOutputForPlayer(p, updatedChunks, addedOrRemovedChunks);
            hasUpdated = (updatedChunksForPlayer && Object.keys(updatedChunksForPlayer).length > 0);

            if (hasNew) {
                // New chunk + update => bundle updates with new chunks in one call.
                if (hasUpdated) Object.assign(addedOrRemovedChunks, updatedChunksForPlayer);

                p.send('chk', UserOutput.pack(addedOrRemovedChunks));

                // Consider player has loaded chunks.
                // TODO [CRIT] cleanup
                // consistencyEngine.setChunksAsLoaded(p, newChunks);
            }
            else if (hasUpdated) {
                // If only an update occurred on an existing, loaded chunk.
                p.send('chk', UserOutput.pack(updatedChunksForPlayer));
            }
        });

        // Empty chunk updates buffer.
        topologyEngine.flushOutput();
    }

    updateEntities() {
        let game              = this._game;
        let physicsEngine     = this._physicsEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedEntities = physicsEngine.getOutput();
        let consistencyOutput = consistencyEngine.getEntityOutput();

        if (updatedEntities.size < 1) return;

        // Broadcast updates.
        // TODO [HIGH] bundle update in one chunk.
        game.players.forEach(p => {
            let pid = p.avatar.id;

            // If an entity in range of player p has just updated.
            let addedOrRemovedEntities = consistencyOutput.get(pid);

            // Consistency output SIMULATES UPDATED ENTITIES AS NEW ENTITIES.
            // Rapidly checked client-side, it prevents from using YET ANOTHER CALL to physicsEngine
            // and to compute distances between entities.
            //let updatedEntities = physicsEngine.getOutputForPlayer(p, updatedEntities);

            // TODO [LOW] detect change in position since the last time.
            // if (!entities), do it nevertheless, for it gives the player its own position.
            p.send('ent', UserOutput.pack([p.avatar.position, p.avatar.rotation, addedOrRemovedEntities]));
        });

        // Empty entity updates buffer.
        physicsEngine.flushOutput();
    }

    updateMeta() {
        let game = this._game;
        game.chat.updateOutput();
    }

}

export default UserOutput;
