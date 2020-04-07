/**
 * User model.
 */

'use strict';

import Factory from './../factory';

class User {

    constructor(hub, socket, nick, id) {
        // Model
        this._hub = hub;
        this._userConnection = Factory.createUserConnection(this, socket);
        this._nick = nick;
        this._id = id;

        // States
        this._ingame = false;
        this._player = null;
    }

    // Model
    get hub() { return this._hub; }
    get id() { return this._id; }
    get connection() { return this._userConnection; }
    get player() { return this._player; }

    get nick() { return this._nick; }
    set nick(nick) { this._nick = nick; }
    get ingame() { return this._ingame; }
    set ingame(value) { if (value) this._ingame = value; }

    // Send a message to this user through its UserConnection.
    send(kind, data) {
        this._userConnection.send(kind, data);
    }

    // Requests the hub to create a new gaming pool.
    requestNewGame(data) {
        return this._hub.requestNewGame(this, data);
    }

    // Join a specific game.
    join(kind, gameId) {
        gameId = parseInt(gameId, 10);

        this._ingame = true;
        let game = this._hub.getGame(kind, gameId);
        if (!game) return false;

        // Stop listening for general game management events...
        // Prevents the user from joining multiple games.
        this._userConnection.idle();

        // Check if the game already contains a player with the same socket
        if (game.hasPlayerForSocket()) return true;
        // TODO consistency for Terrain and Entity and X update on spawn / respawn / rejoin.

        // Create a player associated to this game and spawn it
        let player = Factory.createPlayer(this, game);
        this._player = player;
        game.addPlayer(player);
        return true;
    }

    fetchHubState() {
        let games = this._hub.listGames();
        if (Object.keys(games).length < 1) {
            this._userConnection.send('hub', JSON.stringify(games));
            return;
        }

        for (let kind in games) {
            if (games[kind] instanceof Array && games[kind].length > 0) {
                this._userConnection.send('hub', JSON.stringify(games));
                return;
            }
        }
    }

    // Leave all games (current game). Stay idle.
    leave() {
        console.log('USER LEFT');
        this._ingame = false;
        if (this._player) {
            this._player.leave();
            this._player.destroy(); // OK given player.leave() was called
            // So player does not belong to its game model.
            this._player = null;
        }
        this.listen();
    }

    listen() {
        this._userConnection.listen();
    }

    // Disconnect from ingame socket. Stay inside game model.
    // Maybe the connection will come back.
    disconnect() {
        // Do not destroy player (account for unexpected disconnections)
        if (this._player) this._player.disconnect();
    }

    // Clean references.
    destroy() {
        this._userConnection.destroy();
        // Do not destroy player before its game ends.
        // Useful for user reconnection...
        // if (this._player) this._player.destroy();

        delete this._userConnection;
        delete this._player;
        delete this._hub;
        delete this._nick;
        delete this._id;
        delete this._ingame;
    }

}

export default User;
