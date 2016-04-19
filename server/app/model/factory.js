/**
 *
 */

'use strict';

import DB from './db';
import Hub from './hub';
import User from './user';
import Game from './game';
import Player from './player';

import Connector from '../connector';
import UserCon from '../connector/usercon';
import PlayerCon from '../connector/playercon';

class Factory {

    // High level classes

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

    static createGame() { // TODO think
        return new Game();
    }

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