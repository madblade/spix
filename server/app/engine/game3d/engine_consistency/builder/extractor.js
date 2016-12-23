/**
 *
 */

'use strict';

import WorldGenerator       from '../generator/worldgenerator';
import ChunkIterator        from './iterator_chunks';
import ChunkLoader          from './loader_chunks';

import BlockExtractor       from './surface_blocks_builder';
import FaceExtractor        from './surface_faces_builder';

class Extractor {

    static debug = false;
    static load = true;

    static computeChunkFaces(chunk) {
        let wm = chunk.worldModel;

        // Preload neighbours.
        if (Extractor.debug) console.log('\tPreloading neighbor chunks...');
        ChunkLoader.preloadAllNeighbourChunks(chunk, wm);

        // Detect boundary blocks.
        if (Extractor.debug) console.log('\tExtracting surface...');
        BlockExtractor.extractSurfaceBlocks(chunk);

        // Detect connected boundary face components.
        if (Extractor.debug) console.log("\tComputing connected components...");
        FaceExtractor.extractConnectedComponents(chunk);

        chunk.ready = true;
    }

    static computeChunksForNewPlayer(player, worldModel) {
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
                if (Extractor.debug) console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, worldModel); // virtual polymorphism
                chunksInModel.set(chunk.chunkId, chunk);
            }

            let currentChunk = chunksInModel.get(currentChunkId);
            if (!currentChunk.ready) {
                if (Extractor.debug) console.log("We should extract faces from " + currentChunkId + ".");
                Extractor.computeChunkFaces(currentChunk);
            }

            chunksForNewPlayer[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
        }

        return chunksForNewPlayer;
    }

    static computeNewChunksInRangeForPlayer(player, worldModel, consistencyModel) {
        if (!Extractor.load) return;

        let av = player.avatar;
        if (!av) return; // TODO [INVESTIGATE] (async) Sometimes the avatar is collected just before this static call.
        let p = av.position;

        // Get current chunk.
        let starterChunk = ChunkIterator.getClosestChunk(p[0], p[1], p[2], worldModel);
        if (!starterChunk) return;

        // Loading circle for server (a bit farther)
        ChunkLoader.preLoadNextChunk(player, starterChunk, worldModel, false, consistencyModel);

        // Loading circle for client (nearer)
        // Only load one at a time!
        // TODO [HIGH] check on Z+/-.
        // TODO [LONG-TERM] enhance to transmit chunks when users are not so much active and so on.
        var newChunk = ChunkLoader.getNextPlayerChunk(player, starterChunk, worldModel, consistencyModel);

        // Unloading circle (quite farther)
        // (i.e. recurse currents and test distance)
        var chunksToUnload = ChunkLoader.getOOBPlayerChunks(player, starterChunk, worldModel);

        if (!newChunk && chunksToUnload.length === 0) return;

        var newChunksForPlayer = {};
        var unloadedChunksForPlayer = {};

        if (newChunk) {
            if (Extractor.debug) console.log("New chunk : " + newChunk.chunkId);

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

export default Extractor;
