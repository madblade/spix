/**
 * DB.
 */

'use strict';

import Factory from './../factory';
import CollectionUtils from '../../engine/math/collections';

class UserDataBase {

    constructor(connector) {
        this._connection = connector;
        this._users = new Map();
    }

    containsUser(user) {
        return this._users.has(user.id);
    }

    /**
     * Injects a socket into the user model.
     * Registers the user (a socket knows its user since the connection).
     * @param socket
     */
    registerUser(socket) {
        let users = this._users;
        let nick = '';
        let id = CollectionUtils.generateId(users);
        let hub = this._connection.hub;
        let user = Factory.createUser(hub, socket, nick, id);

        users.set(id, user);
        return user;
    }

    getUser(id) {
        return this._users.get(id);
    }

    removeUser(user) {
        // Remove references to this user
        this._users.delete(user.id);
        user.destroy();
    }

    notifyGameCreation(kind, id) {
        let game = {};
        game[kind] = [id];

        let users = this._users;
        users.forEach(user/*, userId*/ => {
            user.send('hub', JSON.stringify(game));
        });
    }

}

export default UserDataBase;
