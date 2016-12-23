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
        let wm = this._worldModel;

        // Object to be (JSON.stringify)-ed.
        var chunksForNewPlayer = {};
        let chunksInModel = wm.allChunks;

        // From player position, find concerned chunks.
        const pos = player.avatar.position;

        // Belonging chunk coordinates.
        let coords = wm.getChunkCoordinates(pos[0], pos[1], pos[2]);

        const i = coords[0], j = coords[1], k = coords[2];
        const dx = wm.xSize, dy = wm.ySize, dz = wm.zSize;

        let chunkIds = [];
        chunkIds.push((i+','+j+','+k));

        for (let chunkIdId = 0, length = chunkIds.length; chunkIdId < length; ++chunkIdId) {
            let currentChunkId = chunkIds[chunkIdId];
            if (!chunksInModel.has(currentChunkId)) {
                if (ChunkLoader.debug) console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, wm);
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
        if (!ChunkLoader.load) return;

        // TODO [HIGH] filter: no more than X chunk per player per iteration?
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;

        const pos = player.avatar.position;

        // Get current chunk.
        let starterChunk = ChunkIterator.getClosestChunk(pos[0], pos[1], pos[2], worldModel);
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
            consistencyModel.setChunkLoaded(player.avatar.id, newChunk.chunkId);
            newChunksForPlayer[newChunk.chunkId] = [newChunk.fastComponents, newChunk.fastComponentsIds];
        }

        for (let i = 0, l = chunksToUnload; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            // TODO [CRIT] manage chunk load/unload client-side (with all that implies in terms of loading strategy)
            // consistencyModel.setChunkOutOfRange(av.id, chunkToUnload.chunkId);
            unloadedChunksForPlayer[chunkToUnload.chunkId] = null;
        }

        return [newChunksForPlayer, chunksToUnload];
    }

}

export default ChunkLoader;
