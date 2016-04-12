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

    leave() {
        this._game.forget(this);
    }

}

export default Player;
