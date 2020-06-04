/**
 *
 */

'use strict';

class UserConnection
{
    constructor(user, socket)
    {
        this._user = user;
        this._socket = socket;

        this.listen();
    }

    // Model
    get user() { return this._user; }
    set user(user) { this._user = user; }
    get socket() { return this._socket; }
    set socket(socket)
    {
        this.idle();
        this._socket = socket;
        this.listen();
    }

    send(kind, data)
    {
        this._socket.emit(kind, data);
    }

    // Game & hub management.
    listen()
    {
        // Use a unique channel for util functions
        // Actions are specified within the data
        this._socket.on('util', this.onUserRequest.bind(this));
    }

    // Drawback: switch potentially evaluates all statements
    // Advantage: does not load the socket with many listeners
    onUserRequest(data)
    {
        switch (data.request)
        {
            // A user can ask the hub for a new game to be created.
            case 'createGame':
                if (!data.hasOwnProperty('gameType')) {
                    console.error('[Server/UserConnection] Missing game type.');
                    break;
                }
                this.handleCreateGame(data.gameType, data.options);
                break;

            // A user can join a specific game (given a kind and id).
            case 'joinGame':
                console.log('A player tries to join');
                if (!data.hasOwnProperty('gameId') || !data.hasOwnProperty('gameType') ||
                    !data.gameId || !data.gameType || !this.handleJoinGame(data)) {
                    this.send('cantjoin', 'foo');
                }
                break;

            // A user can ask for the list of all available games.
            case 'hub':
                this.handleGetHubState();
                break;
        }
    }

    handleCreateGame(kind, options)
    {
        const created = this._user.requestNewGame(kind, options);
        if (created) console.log('Created new game.');
        return created;
    }

    handleJoinGame(data)
    {
        const joined = this._user.join(data.gameType, data.gameId);
        if (joined) this.send('joined', 'foo');
        return joined;
    }

    handleGetHubState()
    {
        this._user.fetchHubState();
    }

    idle()
    {
        this._socket.off('util', this.onUserRequest.bind(this));
    }

    // Clean references.
    destroy()
    {
        this.idle();
        delete this._user;
        delete this._socket;
    }
}

export default UserConnection;
