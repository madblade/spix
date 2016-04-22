/**
 *
 */

'use strict';

class UserConnection {

    constructor(user, socket) {
        this._user = user;
        this._socket = socket;

        this.listen();
    }

    // Model
    get user() { return this._user; }
    set user(user) { this._user = user; }
    get socket() { return this._socket; }

    send(kind, data) {
        this._socket.emit(kind, data);
    }

    /**
     * Game & hub management
     */
    listen() {
        // A user can ask the hub for a new game to be created.
        this._socket.on('createGame', (kind) => {
            var gameId = this._user.requestNewGame(kind);
            if (gameId) this._user.join(kind, gameId);
        });

        // A user can join a specific game (given a kind and id).
        this._socket.on('joinGame', (data) => {
            if (!data.kind || !data.gameId) return;
            this._user.join(data.kind, data.gameId);
        });

        // A user can ask for the list of all available games.
        this._socket.on('hub', () => {
            this._user.fetchHubState();
        })
    }

    idle() {
        this._socket.off('createGame');
        this._socket.off('joinGame');
        this._socket.off('hub');
    }

}

export default UserConnection;