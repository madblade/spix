/**
 * Utility class encapsulating player management.
 */

'use strict';

import CollectionUtils from '../../engine/math/collections';

/**
 * Note: every time a user joins a given game, it is given a new Player instance.
 * So all Player instances which belong to a game must be cleaned at the moment this game is cleaned.
 */
class PlayerManager
{
    constructor()
    {
        this._players = [];
        this._handleAddPlayer = null;
        this._handleRemovePlayer = null;
    }

    get nbPlayers() { return this._players.length; }

    addPlayer(player)
    {
        this._players.push(player);
        if (this._handleAddPlayer) this._handleAddPlayer(player);
    }

    getRandomPlayer()
    {
        const nbPlayers = this._players.length;
        if (nbPlayers < 1) return null;
        const id = Math.floor(Math.random() * nbPlayers);
        let player = this._players[id];
        if (player && player.avatar) return player.avatar;
        else return null;
    }

    getPlayerFromId(playerId)
    {
        let players = this._players;
        for (let p = 0, l = players.length; p < l; ++p)
        {
            let player = players[p];
            let avatar = player.avatar;
            if (avatar && avatar.entityId === playerId) return player;
        }
        return false;
    }

    removePlayer(player)
    {
        CollectionUtils.removeFromArray(this._players, player);
        if (this._handleRemovePlayer) this._handleRemovePlayer(player);
        player.avatar.die();
        delete player.avatar;

        // Listen to user requests for joining games.
        player.user.listen();

        // Clean references from player
        player.destroy();
    }

    removeAllPlayers()
    {
        if (this._handleRemovePlayer)
            this._players.forEach(p => this._handleRemovePlayer(p));
        this._players.forEach(p => p.destroy()); // Clean references from all players
        this._players = [];
    }

    setAddPlayerBehaviour(f)
    {
        this._handleAddPlayer = f;
    }

    setRemovePlayerBehaviour(f)
    {
        this._handleRemovePlayer = f;
    }

    // Iterator on players.
    forEach(callback)
    {
        return this._players.forEach(p => callback(p));
    }

    // Clean all references.
    destroy()
    {
        this.removeAllPlayers();
        delete this._players;
        delete this._handleAddPlayer;
        delete this._handleRemovePlayer;
    }

    hasPlayerForSocket(socket)
    {
        let players = this._players;
        let nb = players.length;
        if (!socket || !socket.name) return false;

        for (let p = 0; p < nb; ++p)
        {
            let player = players[p];
            if (!player.connection.socket || !player.connection.socket.name) continue;

            if (socket.name === player.connection.socket.name) {
                return true;
            }
        }
        return false;
    }
}

export default PlayerManager;
