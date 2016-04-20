/**
 * User model.
 */

'use strict';

import Factory from './../factory';

class User {

    constructor(hub, socket, nick, id) {
        // Model
        this._hub = hub;
        this._usercon = Factory.createUserCon(this, socket);
        this._nick = nick;
        this._id = id;

        // States
        this._ingame = false;
        this._player = null;
    }

    // Model
    get hub() { return this._hub; }
    get id() { return this._id; }
    get connection() { return this._usercon; }

    get nick() { return this._nick; }
    set nick(nick) { this._nick = nick; }
    get ingame() { return this._ingame; }
    set ingame(value) { if (value) this._ingame = value; }

    /**
     * Send a message to this user through its UserCon.
     * @param kind
     * @param data
     */
    send(kind, data) {
        this._usercon.send(kind, data);
    }

    /**
     * Requests the hub to create a new gaming pool.
     * @param data
     * @returns {*}
     */
    requestNewGame(data) {
        return this._hub.requestNewGame(this, data);
    }

    /**
     * Join a specific game.
     * @param game
     */
    join(game) {
        this._ingame = true;
        var player = Factory.createPlayer(this, game);
        this._player = player;
        game.addPlayer(player);
    }

    /**
     * Leave all games (current game).
     */
    leave() {
        this._ingame = false;
        if (this._player) this._player.leave();
    }

    /**
     * Disconnect from socket.
     */
    disconnect() {
        if (this._player) this._player.disconnect();
        this.send('info', 'Disconnecting');
    }

    /**
     * Cleans references to this user (in its members).
     */
    destroy() {
        this._usercon.user = null;
    }
}

export default User;
