/**
 * Extract chunk surfaces and build hierarchy.
 */

'use strict';

import WorldGenerator       from '../generator/worldgenerator';
import ChunkIterator        from '../builder/iterator_chunks';
import ChunkBuilder         from '../builder/builder_chunks';

class ChunkLoader {

    static debug = false;
    static load = true;

    constructor(consistencyEngine) {
        // Models.
        this._worldModel        = consistencyEngine.worldModel;
        this._consistencyModel  = consistencyEngine.consistencyModel;
    }

    computeChunksForNewPlayer(player) {
        let worldModel = this._worldModel;

        // Object to be (JSON.stringify)-ed.
        var chunksForNewPlayer = {};
        let chunksInModel = worldModel.allChunks;

        // From player position, find concerned chunks.
        var av = player.avatar;
        const pos = av.position;

        // Belonging chunk coordinates.
        let coordinates = worldModel.getChunkCoordinates(pos[0], pos[1], pos[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];

        const dx = worldModel.chunkDimensionX;
        const dy = worldModel.chunkDimensionY;
        const dz = worldModel.chunkDimensionZ;

        let chunkIds = [];
        chunkIds.push((i+','+j+','+k));

        for (let chunkIdId = 0, length = chunkIds.length; chunkIdId < length; ++chunkIdId) {
            let currentChunkId = chunkIds[chunkIdId];
            if (!chunksInModel.has(currentChunkId)) {
                if (ChunkLoader.debug) console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, worldModel); // virtual polymorphism
                chunksInModel.set(chunk.chunkId, chunk);
            }

            let currentChunk = chunksInModel.get(currentChunkId);
            if (!currentChunk.ready) {
                if (ChunkLoader.debug) console.log("We should extract faces from " + currentChunkId + ".");
                ChunkBuilder.computeChunkFaces(currentChunk);
            }

            chunksForNewPlayer[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
        }

        return chunksForNewPlayer;
    }

    computeNewChunksInRangeForPlayer(player) {
        // TODO [HIGH] filter: no more than X chunk per player per iteration?
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;

        if (!ChunkLoader.load) return;

        let av = player.avatar;
        if (!av) return; // TODO [INVESTIGATE] (async) Sometimes the avatar is collected just before this static call.
        let p = av.position;

        // Get current chunk.
        let starterChunk = ChunkIterator.getClosestChunk(p[0], p[1], p[2], worldModel);
        if (!starterChunk) return;

        // Loading circle for server (a bit farther)
        ChunkBuilder.preLoadNextChunk(player, starterChunk, worldModel, false, consistencyModel);

        // Loading circle for client (nearer)
        // Only load one at a time!
        // TODO [HIGH] check on Z+/-.
        // TODO [LONG-TERM] enhance to transmit chunks when users are not so much active and so on.
        var newChunk = ChunkBuilder.getNextPlayerChunk(player, starterChunk, worldModel, consistencyModel);

        // Unloading circle (quite farther)
        // (i.e. recurse currents and test distance)
        var chunksToUnload = ChunkBuilder.getOOBPlayerChunks(player, starterChunk, worldModel);

        if (!newChunk && chunksToUnload.length === 0) return;

        var newChunksForPlayer = {};
        var unloadedChunksForPlayer = {};

        if (newChunk) {
            if (ChunkLoader.debug) console.log("New chunk : " + newChunk.chunkId);

            // Set chunk as added
            consistencyModel.setChunkLoaded(av.id, newChunk.chunkId);
            newChunksForPlayer[newChunk.chunkId] = [newChunk.fastComponents, newChunk.fastComponentsIds];
        }

        for (let i = 0, l = chunksToUnload; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            // TODO [CRIT] deport into consistency update.
            // TODO [CRIT] manage chunk load/unload client-side (with all that implies in terms of loading strategy)
            // consistencyModel.setChunkOutOfRange(av.id, chunkToUnload.chunkId);
            unloadedChunksForPlayer[chunkToUnload.chunkId] = null;
        }

        return [newChunksForPlayer, chunksToUnload];
    }

}

export default ChunkLoader;
