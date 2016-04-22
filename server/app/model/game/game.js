/**
 * Game (instance) model.
 */

'use strict';

import Factory from '../factory';

class Game {

    constructor(gameId, connector) {
        // Utility parameters.
        this._gameId = gameId;
        this._jobId = undefined;
        this._connector = connector;

        //
        this._kind = null;
        this._refreshRate = 200;
        this._isRunning = false;

        //
        this._playerman = Factory.createPlayerManager();
    }

    // Model
    get kind() { return this._kind; }
    get gameId() { return this._gameId; }
    get isRunning() { return this._isRunning; }

    /* ### Manage connection ### */

    /**
     * Send a message to ALL connected users.
     * N.B. encouraged to create custom subchannels within implementations.
     * @param kind
     * @param data
     */
    broadcast(kind, data) {
        // TODO optimize with dynamic subchans
        this._connector.io.to(this._gameId).emit(kind, data);
    }

    /* ### Manage loop ### */

    /**
     * Server-render update function (looped).
     */
    update() {
        console.log("Abstract loop.");
    }

    /**
     * Start game loop.
     */
    start() {
        this._isRunning = true;
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
        this._isRunning = false;
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
        this._playerman.addPlayer(player);

        // Start game if need be.
        if (this._isRunning) return;
        this._isRunning = true; // Double check
        this.start();
    }

    /**
     * Remove player
     * @param player
     */
    removePlayer(player) {
        // Remove from model.
        this._playerman.removePlayer(player);

        // Stop game if need be.
        if (this._playerman.nbPlayers > 0 || !this._isRunning) return;
        this.stop();
    }

    removeAllPlayers() {
        this._playerman.removeAllPlayers();
        this.stop();
    }

    /**
     * To be triggered from Hub only.
     */
    destroy() {
        this.removeAllPlayers();
        this._playerman.destroy();
        delete this._gameId;
        delete this._jobId;
        delete this._connector;
        delete this._kind;
        delete this._refreshRate;
        delete this._isRunning;
    }

}

export default Game;
