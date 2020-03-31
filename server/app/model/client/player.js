/**
 * Player model.
 */

'use strict';

import Factory from './../factory';

class Player {

    constructor(user, game) {
        this._user = user;
        this._game = game;
        // May be given an avatar when logged to a game.
        this._avatar = undefined;
        this._playerConnection = Factory.createPlayerConnection(user.connection.socket);
    }

    // Model
    get game() { return this._game; }
    get user() { return this._user; }

    /**
     * Join a socket room.
     * @param room Socket subset of users.
     */
    join(room) {
        this._playerConnection.join(room);
    }

    /**
     * Send a message to this user.
     * @param kind
     * @param data
     */
    send(kind, data) {
        this._playerConnection.send(kind, data);
    }

    // Leave game and make the game forget.
    leave() {
        this.disconnect();
        if (this._game)
            this._game.removePlayer(this);
    }

    // Close player connection.
    disconnect() {
        if (this._playerConnection)
            this._playerConnection.close();
    }

    /**
     * Define custom interactions (see PlayerConnection).
     * @param message
     * @param behaviour
     */
    on(message, behaviour) {
        this._playerConnection.on(message, behaviour);
    }

    /**
     * Stop listening for a specified input type.
     * @param message
     * @param behaviour
     */
    off(message, behaviour) {
        this._playerConnection.off(message, behaviour);
    }

    // Clean references. Only use from a Game instance.
    destroy() {
        // Destroy player connection which is a single child of this object.
        if (this._playerConnection) this._playerConnection.destroy();
        delete this._playerConnection;
        delete this._game;
        delete this._user;
    }

}

export default Player;
