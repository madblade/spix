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

    update(world) {
        // Get updates from objects
        var updatedChunks = this._game.objectman.updatedChunks;
        var updatedEntities = this._game.objectman.updatedEntities;
        if (Object.keys(updatedChunks).length < 1 && Object.keys(updatedEntities).length < 1) return;

        // Broadcast updates.
        this._game.playerman.forEach((p) => {
            if (UserOutput.playerConcerned(p, updatedChunks, updatedEntities)) {
                p.send('stamp',
                    [
                        p.avatar.position,
                        p.avatar.rotation,
                        this.extractConcernedChunks(p),
                        this.extractConcernedEntities(p)
                    ]
                );
            }
        });

        // TODO loading...

        // Tell object manager we have done update.
        this._game.objectman.updateTransmitted();

        // TODO manage true broadcast events.
        // this._game.broadcast('chat', 'text');
    }

    static playerConcerned(player, chunks, entities) {
        // TODO function of player position.
        return Object.keys(chunks).length > 0 || Object.keys(entities).length > 0;
    }

    extractConcernedEntities(player) {
        return (this._game.objectman.extractEntities(player));
    }

    extractConcernedChunks(player) {
        return (this._game.objectman.extractChunks(player));
    }

}

export default UserOutput;
