/**
 *
 */

'use strict';

import DB from './collections/db';
import Hub from './collections/hub';
import User from './user/user';
import Game from './game/game';
import Player from './user/player';

import Connector from './connector';
import UserCon from './connector/usercon';
import PlayerCon from './connector/playercon';

import GameFactory from '../engine/game.factory';

class Factory {

    // App-level classes

    static createDB(connector) {
        return new DB(connector);
    }

    static createHub(app) {
        return new Hub(app);
    }

    static createUser(hub, socket, nick, id) {
        return new User(hub, socket, nick, id);
    }

    // Gaming classes

    static createGame(kind, gameId, connector) {
        return GameFactory.createGame(kind, gameId, connector);
    }

    // TODO instantiate players according to game kind? Think about it.
    static createPlayer(user, game) {
        return new Player(user, game);
    }

    // Connection classes

    static createConnector(app) {
        return new Connector(app);
    }

    static createUserCon(user, socket) {
        return new UserCon(user, socket);
    }

    static createPlayerCon(socket) {
        return new PlayerCon(socket);
    }

}

export default Factory;