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
        var allChunks = this._game.objectman.allChunks;
        player.send('stamp', UserOutput.extractConcernedChunks(player, allChunks));
    }

    update(world) {
        // Get updates from objects
        var updatedChunks = this._game.objectman.updatedChunks;
        var updatedEntities = this._game.objectman.updatedEntities;
        if (Object.keys(updatedChunks).length < 1 && Object.keys(updatedEntities).length < 1) return;

        // Broadcast updates.
        this._game.playerman.forEach((p) => {
            console.log(p.avatar);
            if (UserOutput.playerConcerned(p, updatedChunks, updatedEntities)) {
                p.send('stamp',
                    [
                        p.avatar.position,
                        UserOutput.extractConcernedChunks(updatedChunks),
                        updatedEntities
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

    static extractConcernedChunks(player, chunks) {
        // TODO process chunks.
        return chunks;
    }

}

export default UserOutput;
