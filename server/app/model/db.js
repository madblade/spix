/**
 * DB.
 */

'use strict';

import User from './user';
import CollectionUtils from '../math/collections/util';

class DB {
    constructor(connector) {
        this._connector = connector;
        this._users = {};
    }

    containsUser(user) {
        return user.id in this._users;
    }

    /**
     * Injects a socket into the user model.
     * Registers the user (a socket knows its user since the connection).
     * @param socket
     */
    registerUser(socket) {
        var nick = "";
        var id = CollectionUtils.generateId(this._users);
        var GE = this._connector.GE;
        var user = new User(GE, socket, nick, id);

        this._users[id] = user;
        return user;
    }

    getUser(id) {
        return this._users[id];
    }

    removeUser(user) {
        // Remove references to this user
        delete this._users[user.id];
        delete socket.user;
    }
}

export default DB;
