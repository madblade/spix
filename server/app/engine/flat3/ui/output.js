/**
 *
 */

'use strict';

class UserOutput {

    constructor(game) {
        this._game = game;
    }

    init(player) {
        var p = player;
        console.log('Init a new player on game ' + this._game.gameId + '.');
        let extractedChunks = this.extractChunksForNewPlayer(p);

        // Load chunks.
        p.send('chk', extractedChunks);

        // Load entities.
        p.send('ent', JSON.stringify(
            [
                p.avatar.position,
                p.avatar.rotation,
                this.extractConcernedEntities(p)
            ]));

        // Consider player has loaded chunks.
        for (let cid in extractedChunks) {
            let cs = this._game.worldman.allChunks;
            if (cs.hasOwnProperty(cid)) p.avatar.setChunkAsLoaded(cs[cid]);
        }
    }

    update() {
        this.updateChunks();
        this.updateEntities();
        this.updateMeta();
    }

    updateChunks()  {
        var updatedChunks = this._game.worldman.updatedChunks;
        if (Object.keys(updatedChunks).length < 1) return;

        this._game.playerman.forEach(p => {
            // If an update occurred on an existing, loaded chunk
            if (!UserOutput.playerConcernedByUpdatedChunks(p, updatedChunks)) return;

            p.send('chk',
                this.extractUpdatedChunksForPlayer(p)
            );
        });

        // Tell object manager we have done update.
        this._game.worldman.chunkUpdatesTransmitted();
    }

    updateEntities() {
        var updatedEntities = this._game.entityman.updatedEntities;
        if (Object.keys(updatedEntities).length < 1) return;

        // Broadcast updates.
        this._game.playerman.forEach(p => {
            // If an entity in range of player p has just updated
            if (!UserOutput.playerConcernedByEntities(p, updatedEntities)) return;

            p.send('ent', JSON.stringify(
                [
                    p.avatar.position,
                    p.avatar.rotation,
                    this.extractConcernedEntities(p)
                ]));

            if (!this.playerHasNewChunksInRange(p)) return;

            let extractedChunks = this.extractNewChunksInRange(p);
            p.send('chk', extractedChunks);

            // Consider player has loaded chunks.
            for (let cid in extractedChunks) {
                let cs = this._game.worldman.allChunks;
                if (cs.hasOwnProperty(cid)) p.avatar.setChunkAsLoaded(cs[cid]);
            }
            // TODO remove old chunks
        });

        // Tell object manager we have done update.
        this._game.entityman.updateEntitiesTransmitted();
    }

    // TODO manage true broadcast events.
    updateMeta() {
        // this._game.broadcast('chat', 'text');
    }

    static playerConcernedByUpdatedChunks(player, chunks) {
        // TODO extract connected subsurface.
        return Object.keys(chunks).length > 0;
    }

    static playerConcernedByEntities(player, entities) {
        // TODO function of player position.
        return Object.keys(entities).length > 0;
    }

    extractConcernedEntities(player) {
        return (this._game.entityman.extractEntitiesInRange(player));
    }

    extractUpdatedChunksForPlayer(player) {
        return (this._game.worldman.extractUpdatedChunksForPlayer(player));
    }

    extractChunksForNewPlayer(player) {
        return (this._game.worldman.extractChunksForNewPlayer(player));
    }

    playerHasNewChunksInRange(player) {
        return (this._game.worldman.hasPlayerNewChunksInRange(player));
    }

    extractNewChunksInRange(player) {
        return (this._game.worldman.extractNewChunksInRangeForPlayer(player));
    }

}

export default UserOutput;
