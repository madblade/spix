/**
 * Game (instance) model.
 */

'use strict';

import Factory from '../factory';

class Game
{
    constructor(hub, gameId, connector, isServerLocal)
    {
        // Utility parameters.
        this._hub = hub;
        this._gameId = gameId;
        this._jobId = null;
        this._timeIdleId = null;
        this._connection = connector;

        //
        this._kind = null;
        this._refreshRate = 200;
        this._isRunning = false;
        this._ready = false;
        this._killed = false;
        this._awaitingJoin = 0;

        //
        this._playerManager = Factory.createPlayerManager();

        // FF optim
        this._isServerLocal = isServerLocal;
    }

    // Model
    get players()       { return this._playerManager; }
    get connector()     { return this._connection; }

    get ready()         { return this._ready; }
    get killed()        { return this._killed; }
    get kind()          { return this._kind; }
    get gameId()        { return this._gameId; }
    get isRunning()     { return this._isRunning; }

    set ready(value)    { this._ready = value; }

    /** Connection **/

    // Send a message to ALL connected users.
    // N.B. encouraged to create custom subchannels within implementations.
    broadcast(kind, data)
    {
        // [PERF] optimize with dynamic subchans?
        this._connection.io.to(this._gameId).emit(kind, data);
    }

    /** Game loop **/

    // Server-render update function (abstract).
    update()
    {
        console.log('Abstract loop.');
    }

    // Start game loop.
    start()
    {
        // Stop waiting for idle threshold.
        clearTimeout(this._timeIdleId);

        // Launch
        this._isRunning = true;
        console.log('[Game] Game running.');

        // When the server is local (on FF), update from pings.
        if (this._isServerLocal)
        {
            console.log('[Game] Awaiting game pings from sandbox.');
        }
        else
        {
            this._jobId = setInterval(() => {
                this.update();
            }, this._refreshRate);
        }
    }

    // Stop game loop.
    pause(doTimeout)
    {
        console.log('[Game] Game stopping.');
        if (this._jobId !== undefined) clearInterval(this._jobId);
        this._isRunning = false;

        // Set idle time limit before despawning this game.
        if (doTimeout) this._timeIdleId = setTimeout(() => this.stop(), 30000);
    }

    /** Players **/

    hasPlayerForSocket(socket)
    {
        return this._playerManager.hasPlayerForSocket(socket);
    }

    addPlayer(player)
    {
        if (!this._ready)
        {
            ++this._awaitingJoin;
            if (this._awaitingJoin < 10)
            {
                console.warn('[Game] A player tries to join although the game is not ready; retrying in 300ms.');
                setTimeout(() => { this.addPlayer(player); }, 300);
            } else {
                console.error('[Game] A player tries to too many times although the game is not ready. Refusing connection.');
            }
            return;
        }
        console.log('[Game] A player joined.');
        this._awaitingJoin = 0;

        // Join channel.
        player.join(this.gameId);

        // Add player to model.
        this._playerManager.addPlayer(player);

        // Start game if need be.
        if (this._isRunning) return;
        this._isRunning = true; // Double check
        this.start();
    }

    removePlayer(player)
    {
        console.log('[Game] A player left.');

        // Remove from model.
        this._playerManager.removePlayer(player);

        // Stop game if need be.
        // if (this._playerManager.nbPlayers > 0 || !this._isRunning) return;
    }

    removeAllPlayers()
    {
        this._playerManager.removeAllPlayers();
        if (this._isRunning) this.pause(true); // Stop with idle timeout.
    }

    // Auto-destruction for being idle for too long. Internal use.
    stop()
    {
        console.log(`Game ${this._gameId} ended for being idle for too long.`);
        this._hub.endGame(this);
    }

    // To be triggered from Hub only.
    destroy()
    {
        this._killed = true;
        if (this._isRunning) this.pause(false); // Going to destroy -> no idle timeout.
        this.removeAllPlayers();
        this._playerManager.destroy();
        delete this._hub;
        delete this._timeIdleId;
        delete this._gameId;
        delete this._jobId;
        delete this._connection;
        delete this._kind;
        delete this._refreshRate;
        delete this._isRunning;
    }
}

export default Game;
