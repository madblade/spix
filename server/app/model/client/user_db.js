/**
 * DB.
 */

'use strict';

import Factory from './../factory';
import CollectionUtils from '../../engine/math/collections';

class UserDataBase {

    constructor(connector) {
        this._connection = connector;
        //this._users = {};
        this._users = new Map();
    }

    containsUser(user) {
        //return user.id in this._users;
        return this._users.has(user.id);
    }

    /**
     * Injects a socket into the user model.
     * Registers the user (a socket knows its user since the connection).
     * @param socket
     */
    registerUser(socket) {
        let users = this._users;
        let nick = "";
        let id = CollectionUtils.generateId(users);
        let hub = this._connection.hub;
        var user = Factory.createUser(hub, socket, nick, id);

        //this._users[id] = user;
        users.set(id, user);
        return user;
    }

    getUser(id) {
        //return this._users[id];
        return this._users.get(id);
    }

    removeUser(user) {
        // Remove references to this user
        //delete this._users[user.id];
        this._users.delete(user.id);
        user.destroy();
    }

    notifyGameCreation(kind, id) {
        var game = {};
        game[kind] = [id];

        let users = this._users;
        users.forEach((user, userId) => {
           user.send('hub', JSON.stringify(game));
        });

        //for (let uid in this._users) {
        //    var user = this._users[uid];
        //    user.send('hub', JSON.stringify(game));
        //}
    }

}

export default UserDataBase;
