/**
 *
 */

'use strict';

import ChunkBuffer      from './buffer_chunk';
import EntityBuffer     from './buffer_entity';

import ChunkLoader      from './loader/loader_chunk';
import EntityLoader     from './loader/loader_entity';

import Generator        from './generator/generator';
import Updater          from './updater/updater';

class ConsistencyEngine
{
    constructor(game)
    {
        this._game = game;

        // Models.
        this._entityModel       = game.entityModel;
        this._worldModel        = game.worldModel;
        this._xModel            = game.xModel;
        this._consistencyModel  = game.consistencyModel;

        // Buffers.
        this._chunkBuffer       = new ChunkBuffer();
        this._entityBuffer      = new EntityBuffer();

        // Other engines.
        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;

        // Internal engine.
        this._generator         = new Generator(this);
        this._chunkLoader       = new ChunkLoader(this);
        this._entityLoader      = new EntityLoader(this);
        this._updater           = new Updater(this);

        // Spawn input
        this._awaitingSpawn     = [];
    }

    get game()                  { return this._game; }
    get worldModel()            { return this._worldModel; }
    get entityModel()           { return this._entityModel; }
    get xModel()                { return this._xModel; }
    get consistencyModel()      { return this._consistencyModel; }

    get physicsEngine()         { return this._physicsEngine; }
    get chunkBuffer()           { return this._chunkBuffer; }
    get entityBuffer()          { return this._entityBuffer; }
    get chunkLoader()           { return this._chunkLoader; }
    get entityLoader()          { return this._entityLoader; }

    // On connection / disconnection.
    spawnPlayer(player)
    {
        this._awaitingSpawn.push(player);
    }

    updateSpawns()
    {
        let awaiting = this._awaitingSpawn;
        const l = awaiting.length;
        if (l < 1) return;

        const status = this.trySpawningPlayer(awaiting[l - 1]);
        if (status) // Managed spawning a player!
        {
            awaiting.pop();
        }
    }

    trySpawningPlayer(player)
    {
        let world = this._worldModel.getFreeWorld();
        let freePosition = world.getFreePosition();
        if (!freePosition)
        {
            // console.log('Failed to spawn player.');
            return false;
        }
        this._entityModel.spawnPlayer(player, world, freePosition);
        this._consistencyModel.spawnPlayer(player);
        this._entityBuffer.spawnPlayer(player);
        this._physicsEngine.spawnPlayer(player);
        this._game._externalInput.listenPlayer(player);
        return true;
    }

    despawnPlayer(playerId)
    {
        this._entityBuffer.removePlayer(playerId);
        this._consistencyModel.removePlayer(playerId);
        this._physicsEngine.removePlayer(playerId);
        this._entityModel.removePlayer(playerId);
    }

    addInput(meta, avatar)
    {
        this._updater.addInput(meta, avatar);
    }

    update()
    {
        this.updateSpawns();
        this._updater.update();
    }

    getChunkOutput()
    {
        return this._chunkBuffer.getOutput();
    }

    getEntityOutput()
    {
        return this._entityBuffer.getOutput();
    }

    getPlayerOutput()
    {
        return this._entityBuffer.addedPlayers;
    }

    getXOutput()
    {
        return this._updater.getOutput();
    }

    flushBuffers(updateEntities)
    {
        this._chunkBuffer.flush();
        if (updateEntities)
            this._entityBuffer.flush();
        this._updater.flushBuffers();
    }

    generateWorld()
    {
        return this._generator.generateWorld();
    }
}

export default ConsistencyEngine;
