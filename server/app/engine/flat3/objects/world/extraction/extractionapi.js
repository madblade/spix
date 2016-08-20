/**
 *
 */

'use strict';

import WorldGenerator from '../generation/worldgenerator';

class ExtractAPI {

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
        chunkIds.push((i+','+j), (i-1+','+j), (i+','+(j-1)), ((i-1)+','+(j-1)));

        for (let chunkIdId = 0, length = chunkIds.length; chunkIdId < length; ++chunkIdId) {
            let currentChunkId = chunkIds[chunkIdId];
            if (!chunksInModel.hasOwnProperty(currentChunkId)) {
                console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, worldManager); // virtual polymorphism
                chunksInModel[chunk.chunkId] = chunk;
            }

            let currentChunk = chunksInModel[currentChunkId];
            if (!currentChunk.ready) {
                console.log("We should extract faces from " + currentChunkId + ".");
                ExtractAPI.computeChunkFaces(currentChunk);
            }

            chunksForNewPlayer[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
        }

        return chunksForNewPlayer;
    }

    // TODO include a distance test.
    static computeUpdatedChunksForPlayer(player, modelChunks, modelUpdatedChunks) {
        var chunksForPlayer = {};

        for (let eid in modelUpdatedChunks) {
            if (!modelChunks.hasOwnProperty(eid) || !player.avatar.loadedChunks.hasOwnProperty(eid)) continue;

            let currentChunk = modelChunks[eid];
            chunksForPlayer[currentChunk.chunkId] = currentChunk.updates;
        }

        return chunksForPlayer;
    }

    static computeNewChunksInRangeForPlayer(player, worldManager) {
        var chunksForPlayer = [];
        let modelChunks = worldManager.allChunks;

        // From player position, find concerned chunks.
        var av = player.avatar;
        const pos = av.position;

        // Belonging chunk coordinates.
        // const dx = worldManager.chunkDimensionX;
        // const dy = worldManager.chunkDimensionY;
        // const dz = worldManager.chunkDimensionZ;
        // const x = Math.floor(pos[0]); const i = (x - x % dx) / dx;
        // const y = Math.floor(pos[1]); const j = (y - y % dy) / dy;
        // const z = Math.floor(pos[2]); const k = (z - z % dz) / dz;
        // (Dreaming of cubic chunks)

        var ld = [];
        for (var eid in av.loadedChunks) {
            if (!modelChunks.hasOwnProperty(eid)) continue;
            ld.push(eid);
        }
        // TODO check which chunks remain to load, and load them.

        return chunksForPlayer;
    }

}

export default ExtractAPI;