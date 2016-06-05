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

        // Tell object manager we have done update.
        this._game.objectman.updateTransmitted();

    }

    updateChunks()  {
        var updatedChunks = this._game.objectman.updatedChunks;
        if (Object.keys(updatedChunks).length < 1) return;

        // TODO optimize loading

        this._game.playerman.forEach((p) => {
            if (UserOutput.playerConcernedByChunks(p, updatedChunks)) {
                p.send('chk', this.extractConcernedChunks(p));
            }
        });

        // Tell object manager we have done update.
        this._game.objectman.updateChunksTransmitted();
    }

    updateEntities() {
        var updatedEntities = this._game.objectman.updatedEntities;
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
        this._game.objectman.updateEntitiesTransmitted();
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
        return (this._game.objectman.extractEntities(player));
    }

    extractConcernedChunks(player) {
        return (this._game.objectman.extractChunks(player));
    }

}

export default UserOutput;
