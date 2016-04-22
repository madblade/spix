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
        this._socket.on('createGame', this.onCreateGame.bind(this));

        // A user can join a specific game (given a kind and id).
        this._socket.on('joinGame', this.onJoinGame.bind(this));

        // A user can ask for the list of all available games.
        this._socket.on('hub', this.onHub.bind(this));
    }

    onCreateGame(kind) {
        var gameId = this._user.requestNewGame(kind);
        if (gameId) this._user.join(kind, gameId);
    }

    onJoinGame(data) {
        if (!data.kind || !data.gameId) return;
        this._user.join(data.kind, data.gameId);
    }

    onHub() {
        this._user.fetchHubState();
    }

    idle() {
        this._socket.off('createGame', this.onCreateGame.bind(this));
        this._socket.off('joinGame', this.onJoinGame.bind(this));
        this._socket.off('hub', this.onHub.bind(this));
    }

    // Clean references.
    destroy() {
        this.idle();
        delete this._user;
        delete this._socket;
    }

}

export default UserConnection;
