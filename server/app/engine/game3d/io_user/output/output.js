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
        let entities = consistencyEngine.getEntityOutputForPlayer(p);
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
    }

    updateChunks()  {
        let game              = this._game;
        let topologyEngine    = this._topologyEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedChunks = topologyEngine.getOutput();

        game.players.forEach(p => {

            let hasNew, hasUpdated;

            // TODO [LOW] check 'player has updated position'
            // TODO [MEDIUM] dynamically remove chunks with GreyZone, serverside
            let newChunks = consistencyEngine.getChunkOutputForPlayer(p);
            hasNew = (newChunks && Object.keys(newChunks).length > 0);

            // TODO [HIGH] couple with consistency inRange check.
            let updatedChunksForPlayer = topologyEngine.getOutputForPlayer(p, updatedChunks, newChunks);
            hasUpdated = (updatedChunksForPlayer && Object.keys(updatedChunksForPlayer).length > 0);

            if (hasNew) {
                // New chunk + update => bundle updates with new chunks in one call.
                if (hasUpdated) Object.assign(newChunks, updatedChunksForPlayer);

                p.send('chk', UserOutput.pack(newChunks));

                // Consider player has loaded chunks.
                consistencyEngine.setChunksAsLoaded(p, newChunks);
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

        if (updatedEntities.size < 1) return;

        // Broadcast updates.
        // TODO [HIGH] bundle update in one chunk.
        game.players.forEach(p => {

            // If an entity in range of player p has just updated
            let entities = consistencyEngine.getEntityOutputForPlayer(p, updatedEntities);

            // TODO [LOW] detect change in position since the last time.
            // if (!entities), do it nevertheless, for it gives the player its own position.
            p.send('ent', UserOutput.pack([p.avatar.position, p.avatar.rotation, entities]));
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
