/**
 * User model.
 */

'use strict';

import Player from './player'
import UserConnection from '../connector/usercon';

class User {

    constructor(GE, socket, nick, id) {
        // Util
        this._GE = GE;
        this._usercon = new UserConnection(this, socket);
        this._nick = nick;
        this._id = id;

        // States
        this._ingame = false;
        this._player = null;
    }

    get GE() {
        return this._GE;
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

    /**
     * Join a specific game.
     * @param game
     */
    join(game) {
        this._ingame = true;
        var player = new Player(this, game);
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
        this.send('info', 'Disconnecting');
    }
}

export default User;
