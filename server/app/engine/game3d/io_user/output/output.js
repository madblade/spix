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

    init(player) {
        let game = this._game;
        let p = player;
        let a = p.avatar;

        let consistencyEngine = this._consistencyEngine;

        // Load chunks.
        let chunks = consistencyEngine.loadChunksForNewPlayer(p);
        p.send('chk', chunks);
        consistencyEngine.setChunksAsLoaded(p, chunks);

        // Load entities.
        let entities = consistencyEngine.extractEntitiesInRange(p);
        p.send('ent', JSON.stringify([a.position, a.rotation, entities]));
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
            let chunks = topologyEngine.getOutputForPlayer(p, updatedChunks); // TODO couple with consistency inRange check.

            // If an update occurred on an existing, loaded chunk
            if (chunks) p.send('chk', chunks);

            // TODO check 'player has updated position'
            // TODO dynamically remove chunks with GreyZone, serverside
            let newChunks = consistencyEngine.extractNewChunksInRangeForPlayer(p);
            // TODO setChunkOutOfRange.

            if (newChunks && Object.keys(newChunks).length > 0) {
                p.send('chk', newChunks);

                // Consider player has loaded chunks.
                for (let cid in newChunks) {
                    let cs = game.worldModel.allChunks;
                    if (cs.has(cid)) p.avatar.setChunkAsLoaded(cid);
                }
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
            let entities = consistencyEngine.extractEntitiesInRange(p, updatedEntities);

            // TODO [LOW] detect change in position since the last time.
            // if (!entities), do it nevertheless, for it gives the player its own position.
            p.send('ent', JSON.stringify([p.avatar.position, p.avatar.rotation, entities]));
        });

        //game.entityModel.updateEntitiesTransmitted();

        // Empty entity updates buffer.
        physicsEngine.flushOutput();
    }

    updateMeta() {
        let game = this._game;
        game.chat.updateOutput();
    }

}

export default UserOutput;
