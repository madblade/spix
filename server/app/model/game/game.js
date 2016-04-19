/**
 * Game (instance) model.
 */

'use strict';

class Game {

    // TODO refactor
    constructor(gameId, connector) {
        this._gameId = gameId;
        this._jobId = undefined;
        this._players = [];
        this._connector = connector;

        this._kind = null;
        this._refreshRate = 200;
        this._isRunning = false;
    }

    // Model
    get kind() { return this._kind; }
    get gameId() { return this._gameId; }

    /* ### Manage connection ### */

    /**
     * Send a message to ALL connected users.
     * N.B. encouraged to create custom subchannels within implementations.
     * @param kind
     * @param data
     */
    broadcast(kind, data) {
        // TODO optimize dynamic subchans
        this.connector.io.to(this._gameId).emit(kind, data);
    }

    /* ### Manage loop ### */

    /**
     * Server-render update function (looped).
     */
    update() {
        console.log("Loop.");
    }

    /**
     * Start game loop.
     */
    start() {
        console.log("Game running.");
        this._jobId = setInterval(() => {
            this.update();
        }, this._refreshRate);
    }

    /**
     * Stop game loop.
     */
    stop() {
        console.log("Game stopping.");
        if (this._jobId !== undefined) clearInterval(this._jobId);
    }

    /* ### Manage players ### */

    /**
     * Add a player.
     * @param player
     */
    addPlayer(player) {
        // Join channel.
        player.join(this.gameId);

        // Add player to model.
        this._players.push(player);

        // Start game if need be.
        if (this._isRunning) return;
        this._isRunning = true;
        this.start();
    }

    /**
     * Remove player
     * @param player
     */
    removePlayer(player) {
        // Remove from model.
        this._players.splice(this._players.indexOf(player), 1);

        // Stop game if need be.
        if (this._players.length > 0 || !this._isRunning) return;
        this._isRunning = false;
        this.stop();
    }
}

export default Game;
