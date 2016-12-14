/**
 *
 */

'use strict';

class Chat {

    constructor(game) {
        this._game = game;
        this._temporaryMessages = [];
    }

    log(message) {
        console.log('On ' + this._game.gameId + ': ' + message);
    }

    hasMessages() {
        return this._temporaryMessages.length > 0;
    }

    updateOutput() {
        // TODO transmit updates to clients.
        if (this.hasMessages()) {
            // broadcast('chat', ...)
        }
    }

    /**
     * @param player
     * A player knows its user (player.user)
     * A user has an id (user.id)
     * @returns {Function}
     */
    playerInput(player) {
        // TODO log input into temporaryMessages.
        return (data) => {
            // Important: don't send responses immediately on input.
            // Store history of received messages in a temporary variable,
            // then wait for server to call 'updateOutput' method after it
            // has finished rendering current game state.
            this.log('received message ' + data + ' from ' + player.user.id);
        };
    }

    broadcast(kind, data) {
        let game = this._game;
        game.connection.io.to(game.gameId).emit(kind, data);
    }

}

export default Chat;
