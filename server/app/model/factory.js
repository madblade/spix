/**
 *
 */

'use strict';

import DB from './appwide/db';
import Hub from './appwide/hub';
import User from './avatar/user';
import Game from './game/game';
import Player from './avatar/player';
import PlayerManager from './avatar/playerman';

import Connector from './link';
import UserCon from './link/usercon';
import PlayerCon from './link/playercon';

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

    static createGame(hub, kind, gameId, connector) {
        return GameFactory.createGame(hub, kind, gameId, connector);
    }

    static createPlayer(user, game) {
        return new Player(user, game);
    }

    static createPlayerManager() {
        return new PlayerManager();
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
