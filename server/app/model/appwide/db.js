/**
 * DB.
 */

'use strict';

import Factory from './../factory';
import CollectionUtils from '../../math/collections/util';

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
        var hub = this._connector.hub;
        var user = Factory.createUser(hub, socket, nick, id);

        this._users[id] = user;
        return user;
    }

    getUser(id) {
        return this._users[id];
    }

    removeUser(user) {
        // Remove references to this user
        delete this._users[user.id];
        user.destroy();
    }
}

export default DB;
