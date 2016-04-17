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

        this._refreshRate = 200;
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
        // Join gamen channel.
        player.socket.join(this._gameId);

        // Add player to model.
        this._players.push(player);
    }

    /**
     * Remove player
     * @param player
     */
    removePlayer(player) {
        // Leave channel.
        player.socket.leave(this.gameId);

        // Remove from model.
        this._players.slice(Array.indexOf(player, this._players), 1);
    }

    /**
     * Start game loop.
     */
    start() {
        console.log("Application running.");
        this._jobId = setInterval(() => {
            this.update();
        }, this._refreshRate);
    }

    /**
     * Stop game loop.
     */
    stop() {
        console.log("Application stopping.");
        if (this._jobId !== undefined) clearInterval(this._jobId);
    }
}

export default Game;
