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

    get socket() {
        return this._socket;
    }

    send(kind, data) {
        this._socket.emit(kind, data);
    }

    configure(socket) {
        socket.on('createGame', (data) => {

        });

        socket.on('joinGame', (data) => {
            var GE = this._user.GE;
            var newGame = GE.addGame(data.kind);
            user.join(newGame);
        });
    }
}

export default UserConnection;