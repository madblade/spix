/**
 * DB.
 */

'use strict';

import User from './user';
import CollectionUtils from '../math/collections/util';

class DB {
    constructor() {
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
        var user = new User(socket, nick, id);

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
