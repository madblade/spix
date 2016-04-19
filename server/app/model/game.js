/**
 * Game (instance) model.
 */

'use strict';

class Game {

    constructor(gameId, connector) {
        this._gameId = gameId;
        this._jobId = undefined;
        this._players = [];
        this._connector = connector;

        this._kind = null;
        this._refreshRate = 200;
        this._isRunning = false;
    }

    get kind() {
        return this._kind;
    }

    get gameId() {
        return this._gameId;
    }

    broadcast(kind, data) {
        // TODO optimize dynamic subchans
        this.connector.io.to(this._gameId).emit(kind, data);
    }

    update() {
        console.log("Loop.");
    }

    /**
     * Add player.
     * @param player
     */
    addPlayer(player) {
        // Join channel.
        player.join(this.gameId);

        // Add player to model.
        this._players.push(player);

        // Start game if need be.
        if (!this._isRunning) {
            this._isRunning = true; // TODO Check threads?
            this.start();
        }
    }

    /**
     * Remove player
     * @param player
     */
    removePlayer(player) {
        // Remove from model.
        this._players.splice(this._players.indexOf(player), 1);

        // Stop game if need be.
        if (this._isRunning && this._players.length < 1) {
            this._isRunning = false;
            this.stop();
        }
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
}

export default Game;
