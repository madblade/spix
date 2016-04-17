/**
 * Player model.
 */

'use strict';

import PlayerConnection from '../connector/playercon';

class Player {

    constructor(user, game) {
        this._user = user;
        this._game = game;
        this._playercon = new PlayerConnection(user.connection.socket);
    }

    get game() {
        return this._game;
    }

    get user() {
        return this._user;
    }

    send(kind, data) {
        this._playercon.send(kind, data);
    }

    leave() {
        this._game.removePlayer(this);
    }

}

export default Player;
