/**
 *
 */

'use strict';

class UserConnection {

    constructor(user, socket) {
        this._user = user;
        this._socket = socket;

        this.configure(socket);
    }

    // Model
    set user(user) { return this._user = user; }
    get socket() { return this._socket; }

    send(kind, data) {
        this._socket.emit(kind, data);
    }

    configure(socket) {
        socket.on('createGame', (data) => {
            var game = this._user.requestNewGame(data);
            if (game) this._user.join(game);
        });

        socket.on('joinGame', (data) => {
        });
    }
}

export default UserConnection;