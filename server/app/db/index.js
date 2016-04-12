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

    registerUser(socket) {
        var nick = "";
        var id = CollectionUtils.generateId(this._users);
        var user = new User(socket, nick, id);

        // Register user (a user knows its socket and reciprocally)
        socket.user = user;
        this._users[id] = user;
    }

    getUser(id) {
        return this._users[id];
    }

    removeUser(socket) {
        var user = socket.user;
        if (user === undefined) return;
        user.leave();
        delete this._users[user.id];
        delete socket.user;
    }
}

export default DB;
