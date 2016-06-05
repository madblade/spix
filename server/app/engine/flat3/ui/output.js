/**
 *
 */

'use strict';

class UserOutput {

    constructor(game) {
        this._game = game;
    }

    init(player) {
        console.log('Init a new player on game ' + this._game.gameId + '.');
        player.send('stamp', this.extractConcernedChunks(player));
    }

    update() {
        this.updateChunks();
        this.updateEntities();
        this.updateMeta();
    }

    updateChunks()  {
        var updatedChunks = this._game.worldman.updatedChunks;
        if (Object.keys(updatedChunks).length < 1) return;

        // TODO optimize loading

        this._game.worldman.forEach((p) => {
            if (UserOutput.playerConcernedByChunks(p, updatedChunks)) {
                p.send('chk', this.extractConcernedChunks(p));
            }
        });

        // Tell object manager we have done update.
        this._game.worldman.updateChunksTransmitted();
    }

    updateEntities() {
        var updatedEntities = this._game.entityman.updatedEntities;
        if (Object.keys(updatedEntities).length < 1) return;

        // Broadcast updates.
        this._game.playerman.forEach((p) => {
            if (UserOutput.playerConcernedByEntities(p, updatedEntities)) {
                p.send('ent',
                    [
                        p.avatar.position,
                        p.avatar.rotation,
                        this.extractConcernedEntities(p)
                    ]
                );
            }
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
        return (this._game.entityman.extractEntities(player));
    }

    extractConcernedChunks(player) {
        return (this._game.worldman.extractChunks(player));
    }

}

export default UserOutput;
