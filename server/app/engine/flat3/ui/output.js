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

        // Broadcast updates.
        this._game.playerman.forEach((p) => {
            if (UserOutput.playerConcerned(p, updatedChunks)) {
                p.send('stamp', UserOutput.extractConcernedChunks(updatedChunks));
            }
        });

        // Tell object manager we have done update.
        this._game.objectman.updateTransmitted();

        // TODO manage true broadcast events.
        // this._game.broadcast('chat', 'text');
    }

    static playerConcerned(player, chunks) {
        // TODO check if the user has loaded concerned chunks.
        return false;
    }

    static extractConcernedChunks(player, chunks) {
        // TODO process chunks.
        return chunks;
    }

}

export default UserOutput;
