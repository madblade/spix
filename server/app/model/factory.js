/**
 *
 */

'use strict';

import UserDB           from './client/user_db';
import Hub              from './game/hub';

import User             from './client/user';
import Player           from './client/player';
import PlayerManager    from './client/player_manager';

import Connection       from './connection/connection';
import UserConnection   from './connection/user_connection';
import PlayerConnection from './connection/player_connection';

// import Game             from './game/game';
import GameFactory      from '../engine/factory';

class Factory {

    /** App-level classes */

    static createUserDB(connector) {
        return new UserDB(connector);
    }

    static createHub(app) {
        return new Hub(app);
    }

    static createUser(hub, socket, nick, id) {
        return new User(hub, socket, nick, id);
    }

    /** Gaming classes */

    static createGame(hub, kind, gameId, connector) {
        return GameFactory.createGame(hub, kind, gameId, connector);
    }

    static createPlayer(user, game) {
        return new Player(user, game);
    }

    static createPlayerManager() {
        return new PlayerManager();
    }

    /** Connection classes */

    static createConnection(app) {
        return new Connection(app);
    }

    static createUserConnection(user, socket) {
        return new UserConnection(user, socket);
    }

    static createPlayerConnection(socket) {
        return new PlayerConnection(socket);
    }

}

export default Factory;
