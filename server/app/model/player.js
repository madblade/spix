/**
 * Player model.
 */

'use strict';

class Player {

    constructor(user, game) {
        this._user = user;
        this._game = game;
    }

    get game() {
        return this._game;
    }

    get user() {
        return this._user;
    }

    get socket() {
        return this._user.socket;
    }

    send(kind, data) {
        this._user.socket.emit(kind, data);
    }

    leave() {
        this._game.removePlayer(this);
    }

}

export default Player;
