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
        p.send('chk', extractedChunks);
        p.send('ent', [p.avatar.position, p.avatar.rotation, this.extractConcernedEntities(p)]);
        for (let cid in extractedChunks) {
            if (!extractedChunks.hasOwnProperty(cid)) continue;
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

        this._game.playerman.forEach((p) => {
            if (!UserOutput.playerConcernedByChunks(p, updatedChunks)) return;
            p.send('chk', this.extractConcernedChunks(p));
        });

        // Tell object manager we have done update.
        this._game.worldman.updateChunksTransmitted();
    }

    updateEntities() {
        var updatedEntities = this._game.entityman.updatedEntities;
        if (Object.keys(updatedEntities).length < 1) return;

        // Broadcast updates.
        this._game.playerman.forEach((p) => {
            if (!UserOutput.playerConcernedByEntities(p, updatedEntities)) return;
            p.send('ent', [p.avatar.position, p.avatar.rotation, this.extractConcernedEntities(p)]);
        });

        // Tell object manager we have done update.
        this._game.entityman.updateEntitiesTransmitted();
    }

    // TODO manage true broadcast events.
    updateMeta() {
        // this._game.broadcast('chat', 'text');
    }

    static playerConcernedByChunks(player, chunks) {
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

    extractConcernedChunks(player) {
        return (this._game.worldman.extractUpdatedChunks(player));
    }

    extractChunksForNewPlayer(player) {
        return (this._game.worldman.extractChunksForNewPlayer(player));
    }

}

export default UserOutput;
