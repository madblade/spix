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

    // Squared Euclidean.
    static distance(pos1, pos2) {
        let result = 0, d;
        for (let i = 0; i<3; ++i) { d = pos1[i]-pos2[i]; result += d*d; }
        return result;
    };

    computeChunksForNewPlayer(player) {
        let wm = this._worldModel;
        let avatar = player.avatar;

        // Object to be (JSON.stringify)-ed.
        var chunksForNewPlayer = {};
        let chunksInModel = wm.allChunks;

        // From player position, find concerned chunks.
        const playerPosition = avatar.position;
        let coords = wm.getChunkCoordinates(playerPosition[0], playerPosition[1], playerPosition[2]);

        const i = coords[0], j = coords[1], k = coords[2];
        const dx = wm.xSize, dy = wm.ySize, dz = wm.zSize;
        let minChunkDistance = Number.POSITIVE_INFINITY;

        let chunkIds = [];
        chunkIds.push((i+','+j+','+k));

        for (let m = 0, length = chunkIds.length; m < length; ++m) {
            let currentChunkId = chunkIds[m];

            // Generate chunk.
            if (!chunksInModel.has(currentChunkId)) {
                if (ChunkLoader.debug) console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, wm);
                chunksInModel.set(currentChunkId, chunk);
            }

            // Extract surfaces.
            let currentChunk = chunksInModel.get(currentChunkId);
            if (!currentChunk.ready) {
                if (ChunkLoader.debug) console.log("We should extract faces from " + currentChunkId + ".");
                ChunkBuilder.computeChunkFaces(currentChunk);
            }

            // Test for distance.
            const ids = currentChunkId.split(',');
            const chunkPosition = [ids[0]*dx/2, ids[1]*dy/2, ids[2]*dz/2];
            const distance = ChunkLoader.distance(chunkPosition, playerPosition);
            if (distance < minChunkDistance) {
                minChunkDistance = distance;
                avatar.nearestChunkId = currentChunk;
            }

            chunksForNewPlayer[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
        }

        return chunksForNewPlayer;
    }

    computeNewChunksInRange(player) {
        if (!ChunkLoader.load) return;

        // TODO [HIGH] filter: no more than X chunk per player per iteration?
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;

        const avatar = player.avatar;
        const pos = avatar.position;

        // Has nearest chunk changed?
        let coords = worldModel.getChunkCoordinates(pos[0], pos[1], pos[2]);
        let nearestChunkId = coords[0]+','+coords[1]+','+coords[2];
        let formerNearestChunkId = avatar.nearestChunkId;

        // Get current chunk.
        let starterChunk = worldModel.getChunkById(nearestChunkId);
        if (!starterChunk) return;

        // Return variables.
        var newChunksForPlayer = {};
        var unloadedChunksForPlayer = {};

        // Case 1: need to load chunks up to R_i (inner circle)
        // and to unload from R_i to R_o (outer circle).
        if (!consistencyModel.doneChunkLoadingPhase(player)) {
            //console.log(Math.random());
            newChunksForPlayer = this.loadInnerSphere(player, starterChunk);
            // For (i,j,k) s.t. D = d({i,j,k}, P) < P.thresh, ordered by increasing D
                // if !P.has(i,j,k)
                    // Load (i,j,k) and break

            unloadedChunksForPlayer = this.unloadInnerToOuterSphere(player, starterChunk);
            // For (i,j,k) s.t. P.has(i,j,k)
                // if d({i,j,k}, P) > P.thresh
                    // Unload (i,j,k)
            avatar.nearestChunkId = nearestChunkId;
        }

        // Case 2: chunks were loaded up to R_i, but player walked
        // into another chunk. Need to ensure all chunks are loaded up to R_i
        // and every loaded chunk that happens to be outside R_o is unloaded.
        else if (nearestChunkId !== formerNearestChunkId) {
            console.log('loading done, walking towards new chunk');

            // For (i,j,k) s.t. d({i,j,k}, P) < P.thresh
                // if !P.has(i,j,k)
                    // Load (i,j,k) and break
            newChunksForPlayer = this.loadInnerSphere(player, starterChunk);

            // For (i,j,k) s.t. P.has(i,j,k)
                // if d({i,j,k}, P) > P.outerThresh
                    // Unload (i,j,k)
            unloadedChunksForPlayer = this.unloadOuterSphere(player, starterChunk);
            avatar.nearestChunkId = nearestChunkId;
        }

        // No avatar position change, nothing to update.
        else return;

        // Nothing to update.
        if (Object.keys(newChunksForPlayer).length < 1 &&
            Object.keys(unloadedChunksForPlayer).length < 1) return;

        return [newChunksForPlayer, unloadedChunksForPlayer];
    }

    loadInnerSphere(player, starterChunk) {
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;

        var newChunksForPlayer = {};

        // Loading circle for server (a bit farther)
        ChunkBuilder.preLoadNextChunk(player, starterChunk, worldModel, false, consistencyModel);

        // Loading circle for client (nearer)
        // Only load one at a time!
        // TODO [HIGH] check on Z+/-.
        // TODO [LONG-TERM] enhance to transmit chunks when users are not so much active and so on.
        var newChunk = ChunkBuilder.preLoadNextChunk(player, starterChunk, worldModel, true, consistencyModel);

        if (newChunk) {
            if (ChunkLoader.debug) console.log("New chunk : " + newChunk.chunkId);
            newChunksForPlayer[newChunk.chunkId] = [newChunk.fastComponents, newChunk.fastComponentsIds];
        }

        return newChunksForPlayer;
    }

    // TODO [CRIT] implement
    unloadInnerToOuterSphere(player, starterChunk) {
        let consistencyModel = this._consistencyModel;
        return {}; // this.unloadOuterSphere(player, starterChunk);
    }

    unloadOuterSphere(player, starterChunk) {
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;
        var unloadedChunksForPlayer = {};

        // Unloading circle (quite farther)
        // (i.e. recurse currents and test distance)
        var chunksToUnload = ChunkBuilder.getOOBPlayerChunks(player, starterChunk, worldModel);

        for (let i = 0, l = chunksToUnload; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            // TODO [CRIT] manage chunk load/unload client-side (with all that implies in terms of loading strategy)
            unloadedChunksForPlayer[chunkToUnload.chunkId] = null;
        }

        return unloadedChunksForPlayer;
    }

}

export default ChunkLoader;
