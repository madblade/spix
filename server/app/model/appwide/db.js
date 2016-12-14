/**
 * DB.
 */

'use strict';

import Factory from './../factory';
import CollectionUtils from '../../engine/math/collections/util';

class DB {

    constructor(connector) {
        this._connection = connector;
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
        var hub = this._connection.hub;
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

    notifyGameCreation(kind, id) {
        var game = {};
        game[kind] = [id];

        for (let uid in this._users) {
            var user = this._users[uid];
            user.send('hub', JSON.stringify(game));
        }
    }

}

export default DB;
