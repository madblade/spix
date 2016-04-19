/**
 * User model.
 */

'use strict';

import Factory from './factory';

class User {

    constructor(hub, socket, nick, id) {
        // Util
        this._hub = hub;
        this._usercon = Factory.createUserCon(this, socket);
        this._nick = nick;
        this._id = id;

        // States
        this._ingame = false;
        this._player = null;
    }

    get hub() {
        return this._hub;
    }

    // Model
    get nick() {
        return this._nick;
    }

    set nick(nick) {
        this._nick = nick;
    }

    get id() {
        return this._id;
    }

    get ingame() {
        return this._ingame;
    }

    set ingame(value) {
        if (value) this._ingame = value;
    }

    // Connection
    get connection() {
        return this._usercon;
    }

    send(kind, data) {
        this._usercon.send(kind, data);
    }

    //
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
        var player = this._player;
        if (player) player.leave();
    }

    /**
     * Disconnect from socket.
     */
    disconnect() {
        var player = this._player;
        if (player) player.disconnect();
        this.send('info', 'Disconnecting');
    }

    destroy() {
        this._usercon.user = null;
    }
}

export default User;
