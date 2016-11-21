/**
 *
 */

'use strict';

class UserOutput {

    static debug = false;

    constructor(game) {
        this._game = game;
    }

    init(player) {
        let game = this._game;
        let p = player;
        let a = p.avatar;

        // Load chunks.
        let chunks = game.worldman.extractChunksForNewPlayer(p);
        p.send('chk', chunks);

        // Load entities.
        let entities = game.entityman.extractEntitiesInRange(p);
        p.send('ent', JSON.stringify([a.position, a.rotation, entities]));

        // Consider player has loaded chunks.
        for (let cid in chunks) {
            let cs = game.worldman.allChunks;
            if (cs.hasOwnProperty(cid)) a.setChunkAsLoaded(cs[cid]);
        }

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
        let game = this._game;
        var updatedChunks = game.worldman.updatedChunks;
        if (Object.keys(updatedChunks).length < 1) return;

        game.playerman.forEach(p => {
            if (!UserOutput.playerConcernedByUpdatedChunks(p, updatedChunks)) return;

            // If an update occurred on an existing, loaded chunk
            let chunks = game.worldman.extractUpdatedChunksForPlayer(p);
            p.send('chk', chunks);
        });

        // Tell object manager we have done update.
        game.worldman.chunkUpdatesTransmitted();
    }

    updateEntities() {
        let game = this._game;
        var updatedEntities = game.entityman.updatedEntities;
        if (Object.keys(updatedEntities).length < 1) return;

        // Broadcast updates.
        // TODO bundle update in one chunk.
        game.playerman.forEach(p => {
            if (!UserOutput.playerConcernedByEntities(p, updatedEntities)) return;

            // If an entity in range of player p has just updated
            let entities = game.entityman.extractEntitiesInRange(p);
            // TODO detect change in position since the last time.

            p.send('ent', JSON.stringify([p.avatar.position, p.avatar.rotation, entities]));

            // TODO check 'player has updated position'
            let chunks = game.worldman.extractNewChunksInRangeForPlayer(p);

            if (!chunks || Object.keys(chunks).length === 0) return;

            // TODO dynamically remove chunks with GreyZone, serverside
            p.send('chk', chunks);

            // Consider player has loaded chunks.
            for (let cid in chunks) {
                let cs = game.worldman.allChunks;
                if (cs.hasOwnProperty(cid)) p.avatar.setChunkAsLoaded(cs[cid]);
            }
            // TODO remove old chunks
        });

        // Tell object manager we have done update.
        game.entityman.updateEntitiesTransmitted();
    }

    updateMeta() {
        let game = this._game;
        game.chat.updateOutput();
    }

    static playerConcernedByUpdatedChunks(player, chunks) {
        // TODO extract connected subsurface.6
        return Object.keys(chunks).length > 0;
    }

    static playerConcernedByEntities(player, entities) {
        // TODO function of player position.
        return Object.keys(entities).length > 0;
    }

}

export default UserOutput;
