/**
 *
 */

'use strict';

import WorldGenerator from '../generation/worldgenerator';
import ChunkIterator from '../topology/chunkiterator';
import ChunkLoader from '../loading/chunkloader';

class ExtractAPI {

    static debug = false;
    static load = true;

    static computeChunkFaces(chunk) {
        chunk.computeFaces();
    }

    static computeChunksForNewPlayer(player, worldManager) {
        var chunksForNewPlayer = {};
        let chunksInModel = worldManager.allChunks;

        // From player position, find concerned chunks.
        var av = player.avatar;
        const pos = av.position;

        // Belonging chunk coordinates.
        let coordinates = worldManager.getChunkCoordinates(pos[0], pos[1], pos[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];

        const dx = worldManager.chunkDimensionX;
        const dy = worldManager.chunkDimensionY;
        const dz = worldManager.chunkDimensionZ;

        let chunkIds = [];
        chunkIds.push((i+','+j+','+k));
        //chunkIds.push((i+','+j), ((i-1)+','+j), ((i-1)+','+(j-1)));
        //chunkIds.push((i+','+j), (i-1+','+j), (i+','+(j-1)), ((i-1)+','+(j-1)));

        for (let chunkIdId = 0, length = chunkIds.length; chunkIdId < length; ++chunkIdId) {
            let currentChunkId = chunkIds[chunkIdId];
            if (!chunksInModel.hasOwnProperty(currentChunkId)) {
                if (ExtractAPI.debug) console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, worldManager); // virtual polymorphism
                chunksInModel[chunk.chunkId] = chunk;
            }

            let currentChunk = chunksInModel[currentChunkId];
            if (!currentChunk.ready) {
                if (ExtractAPI.debug) console.log("We should extract faces from " + currentChunkId + ".");
                ExtractAPI.computeChunkFaces(currentChunk);
            }

            chunksForNewPlayer[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
        }

        // Force update entity to load all chunks
        //if (!av.areChunksLoaded) {
        //    worldManager.entityModel.entityUpdated(av.id);
        //}

        return chunksForNewPlayer;
    }

    // TODO include a distance test.
    static computeUpdatedChunksForPlayer(player, modelChunks, modelUpdatedChunks) {
        var chunksForPlayer = {};

        for (let eid in modelUpdatedChunks) {
            if (!modelChunks.hasOwnProperty(eid) || !player.avatar.loadedChunks.hasOwnProperty(eid))
                continue;

            let currentChunk = modelChunks[eid];
            chunksForPlayer[currentChunk.chunkId] = currentChunk.updates;
        }

        return chunksForPlayer;
    }

    static computeNewChunksInRangeForPlayer(player, worldManager) {
        if (!ExtractAPI.load) return;

        let av = player.avatar;
        if (!av) return; // (Asynchronous) Sometimes the avatar is collected just before this static call.
        let p = av.position;

        // Get current chunk.
        let starterChunk = ChunkIterator.getClosestChunk(p[0], p[1], p[2], worldManager);
        if (!starterChunk) return;

        // Loading circle for server (a bit farther)
        ChunkLoader.preLoadNextChunk(player, starterChunk, worldManager, false);

        // Loading circle for client (nearer)
        // Only load one at a time!
        // TODO algorithmical zeefication
        // TODO enhance to transmit chunks when users are not so much active and so on
        var newChunk = ChunkLoader.getNextPlayerChunk(player, starterChunk, worldManager);

        // Unloading circle (quite farther)
        // (i.e. recurse currents and test distance)
        var chunksToUnload = ChunkLoader.getOOBPlayerChunks(player, starterChunk, worldManager);

        if (!newChunk && chunksToUnload.length === 0) return null;

        var chunksForPlayer = {};

        if (newChunk) {
            if (ExtractAPI.debug) console.log("New chunk : " + newChunk.chunkId);

            // Set chunk as added
            av.setChunkAsLoaded(newChunk);
            chunksForPlayer[newChunk.chunkId] = [newChunk.fastComponents, newChunk.fastComponentsIds];
        }

        for (let i = 0, l = chunksToUnload; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            av.setChunkOutOfRange(chunkToUnload);
            chunksForPlayer[chunkToUnload] = null;
        }

        //if (!av.areChunksLoaded) {
        //    worldManager.entityModel.entityUpdated(av.id);
        //}

        return chunksForPlayer;
    }

}

export default ExtractAPI;
