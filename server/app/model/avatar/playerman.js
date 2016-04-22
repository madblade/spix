/**
 * Utility class encapsulating player management.
 */

'use strict';

class PlayerManager {

    constructor() {
        this._players = [];
        this._handleAddPlayer = null;
        this._handleRemovePlayer = null;
    }

    get nbPlayers() { return this._players.length; }

    addPlayer(player) {
        this._players.push(player);
        if (this._handleAddPlayer) this._handleAddPlayer();
    }

    removePlayer(player) {
        this._players.splice(this._players.indexOf(player), 1);
        if (this._handleRemovePlayer) this._handleRemovePlayer();
    }

    setAddPlayerBehaviour(f) {
        if (typeof f === "function") this._handleAddPlayer = f;
    }

    setRemovePlayerBehaviour(f) {
        if (typeof f === "function") this._handleRemovePlayer = f;
    }

    /**
     * Iterator on players.
     * @param callback
     */
    forEach(callback) {
        return this._players.forEach((p) => callback(p));
    }

}

export default PlayerManager;
