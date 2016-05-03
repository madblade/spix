/**
 * Game (instance) model.
 */

'use strict';

import Factory from '../factory';

class Game {

    constructor(hub, gameId, connector) {
        // Utility parameters.
        this._hub = hub;
        this._gameId = gameId;
        this._jobId = null;
        this._timeIdleId = null;
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
        // Stop waiting for idle threshold.
        clearTimeout(this._timeIdleId);

        // Launch
        this._isRunning = true;
        console.log("Game running.");
        this._jobId = setInterval(() => {
            console.log("Running");
            this.update();
        }, this._refreshRate);
    }

    /**
     * Stop game loop.
     */
    stop(doTimeout) {
        console.log("Game stopping.");
        if (this._jobId !== undefined) clearInterval(this._jobId);
        this._isRunning = false;

        // Set idle time limit before despawning this game.
        if (doTimeout) this._timeIdleId = setTimeout(() => this.suicide(), 5000);
    }

    /* ### Manage players ### */

    /**
     * Add a player.
     * @param player
     */
    addPlayer(player) {
        console.log('A player joined.');

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
     * Remove a player.
     * @param player
     */
    removePlayer(player) {
        console.log('A player left.');

        // Remove from model.
        this._playerman.removePlayer(player);

        // Stop game if need be.
        if (this._playerman.nbPlayers > 0 || !this._isRunning) return;
        this.stop(true); // Stop with idle timeout.
    }

    removeAllPlayers() {
        this._playerman.removeAllPlayers();
        this.stop(true); // Stop with idle timeout.
    }

    // Auto-destruction for being idle for too long. Internal use.
    suicide() {
        this._hub.endGame(this);
        console.log("Game " + this._gameId + " ended for being idle for too long.");
    }

    /**
     * To be triggered from Hub only.
     */
    destroy() {
        if (this._isRunning) this.stop(false); // Going to destroy -> no idle timeout.
        this.removeAllPlayers();
        this._playerman.destroy();
        delete this._hub;
        delete this._timeIdleId;
        delete this._gameId;
        delete this._jobId;
        delete this._connector;
        delete this._kind;
        delete this._refreshRate;
        delete this._isRunning;
    }

}

export default Game;
