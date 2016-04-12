/**
 * Game (instance) model.
 */

'use strict';

class Game {

    constructor(gameId) {
        this._gameId = gameId;
        this._jobId = undefined;
        this._players = [];
    }

    get gameId() {
        return this._gameId;
    }

    update() {
        console.log("Loop.");
    }

    /**
     * Add player.
     * @param player
     */
    spawn(player) {
        this._players.push(player);
    }

    /**
     * Remove player
     * @param player
     */
    forget(player) {
        this._players.slice(Array.indexOf(player, this._players), 1);
    }

    /**
     * Start game loop.
     */
    start() {
        console.log("Application running.");
        this._jobId = setInterval(() => {
            this.update();
        }, 200);
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
