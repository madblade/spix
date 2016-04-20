/**
 * Player model.
 */

'use strict';

import Factory from './../factory';

class Player {

    constructor(user, game) {
        this._user = user;
        this._game = game;
        this._playercon = Factory.createPlayerCon(user.connection.socket);
    }

    // Model
    get game() { return this._game; }
    get user() { return this._user; }

    /**
     * Join a socket room.
     * @param room Socket subset of users.
     */
    join(room) {
        this._playercon.join(room);
    }

    /**
     * Send a message to this user.
     * @param kind
     * @param data
     */
    send(kind, data) {
        this._playercon.send(kind, data);
    }

    leave() {
        this._game.removePlayer(this);
    }

    disconnect() {
        this._playercon.leaveAll();
    }

    /**
     * Define custom interactions (see PlayerCon).
     * @param message
     * @param behaviour
     */
    on(message, behaviour) {
        this._playercon.on(message, behaviour);
    }

}

export default Player;
