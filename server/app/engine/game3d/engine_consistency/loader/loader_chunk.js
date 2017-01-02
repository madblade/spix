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
    static bench = false;
    static serverLoadingRadius = 6;

    constructor(consistencyEngine) {
        // Models.
        this._worldModel        = consistencyEngine.worldModel;
        this._consistencyModel  = consistencyEngine.consistencyModel;
    }

    // Squared Euclidean.
    static squaredDistance(pos1, pos2) {
        let result = 0, d;
        for (let i = 0; i<3; ++i) { d = pos1[i]-pos2[i]; result += d*d; }
        return result;
    };

    computeChunksForNewPlayer(player) {
        let avatar = player.avatar;
        let worldId = avatar.worldId;
        let world = this._worldModel.getWorld(worldId);

        // Object to be (JSON.stringify)-ed.
        var chunksForNewPlayer = {};
        let chunksInModel = world.allChunks;

        // From player position, find concerned chunks.
        const playerPosition = avatar.position;
        let coords = world.getChunkCoordinates(playerPosition[0], playerPosition[1], playerPosition[2]);

        const i = coords[0], j = coords[1], k = coords[2];
        const dx = world.xSize, dy = world.ySize, dz = world.zSize;
        let minChunkDistance = Number.POSITIVE_INFINITY;

        let chunkIds = [];
        chunkIds.push((i+','+j+','+k));

        for (let m = 0, length = chunkIds.length; m < length; ++m) {
            let currentChunkId = chunkIds[m];

            // Generate chunk.
            if (!chunksInModel.has(currentChunkId)) { // TODO [LOW] worldify or delegate to consistency updater (better).
                if (ChunkLoader.debug) console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = WorldGenerator.generateFlatChunk(dx, dy, dz, currentChunkId, world);
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
            const chunkPosition = [parseInt(ids[0])*dx/2, parseInt(ids[1])*dy/2, parseInt(ids[2])*dz/2];
            const distance = ChunkLoader.squaredDistance(chunkPosition, playerPosition);
            if (distance < minChunkDistance) {
                minChunkDistance = distance;
                avatar.nearestChunkId = currentChunk;
            }

            let cfnpw = chunksForNewPlayer[worldId];
            if (cfnpw) {
                cfnpw[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
            } else {
                chunksForNewPlayer[worldId] = {};
                chunksForNewPlayer[worldId][currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
            }
        }

        return chunksForNewPlayer;
    }

    // TODO [CRIT] worldify X-access chunks. n nearest, 1 chunk per X.
    computeNewChunksInRange(player) {
        if (!ChunkLoader.load) return;
        const avatar = player.avatar;

        // TODO [CRIT] worldify idea : X-WORLD distance adds a 1-chunk infinite norm distance every time it crosses a portal
        // TODO [HIGH] worldify filter: no more than X chunk per player per iteration?
        let worldId = avatar.worldId;
        let world = this._worldModel.getWorld(worldId);
        let consistencyModel = this._consistencyModel;

        const pos = avatar.position;

        // Has nearest chunk changed?
        let coords = world.getChunkCoordinates(pos[0], pos[1], pos[2]);
        let nearestChunkId = coords[0]+','+coords[1]+','+coords[2];
        let formerNearestChunkId = avatar.nearestChunkId;

        // Get current chunk.
        let starterChunk = world.getChunkById(nearestChunkId);
        if (!starterChunk) return;

        // Return variables.
        var newChunksForPlayer = {};
        var unloadedChunksForPlayer = {};

        // Case 1: need to load chunks up to R_i (inner circle)
        // and to unload from R_i to R_o (outer circle).
        if (!consistencyModel.doneChunkLoadingPhase(player, starterChunk)) {
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
        else {
            return;
        }

        // Nothing to update.
        if (Object.keys(newChunksForPlayer).length < 1 &&
            Object.keys(unloadedChunksForPlayer).length < 1) return;

        return [newChunksForPlayer, unloadedChunksForPlayer];
    }

    loadInnerSphere(player, starterChunk) {
        let worldId = player.avatar.worldId;
        let world = this._worldModel.getWorld(worldId); // TODO [CRIT] worldify think of another location for that
        let consistencyModel = this._consistencyModel;
        let sRadius = ChunkLoader.serverLoadingRadius;

        var newChunksForPlayer = {};

        // Loading circle for server (a bit farther)
        let t = process.hrtime();
        ChunkBuilder.preLoadNextChunk(player, starterChunk, world, false, consistencyModel, sRadius);
        let dt1 = (process.hrtime(t)[1]/1000);
        if (ChunkLoader.bench && dt1 > 1000) console.log('\t\t' + dt1 + ' preLoad ForServer.');

        // Loading circle for client (nearer)
        // Only load one at a time!
        // TODO [HIGH] check on Z+/-.
        // TODO [LONG-TERM] enhance to transmit chunks when users are not so much active and so on.
        t = process.hrtime();
        var newChunk = ChunkBuilder.preLoadNextChunk(player, starterChunk, world, true, consistencyModel, sRadius);
        dt1 = (process.hrtime(t)[1]/1000);
        if (ChunkLoader.bench && dt1 > 1000) console.log('\t\t' + dt1 + ' preLoad ForPlayer.');

        if (newChunk) {
            if (ChunkLoader.debug) console.log("New chunk : " + newChunk.chunkId);
            newChunksForPlayer[worldId] = {[newChunk.chunkId]: [newChunk.fastComponents, newChunk.fastComponentsIds]}; // TODO [HIGH] not only one at a time
        }

        return newChunksForPlayer;
    }

    unloadInnerToOuterSphere(player, starterChunk) {
        let consistencyModel = this._consistencyModel;

        let minThreshold = player.avatar.chunkRenderDistance;
        let maxThreshold = ChunkLoader.serverLoadingRadius;
        minThreshold = Math.min(minThreshold, maxThreshold);

        return ChunkBuilder.getOOBPlayerChunks(player, starterChunk, consistencyModel, minThreshold);
    }

    unloadOuterSphere(player, starterChunk) {
        let consistencyModel = this._consistencyModel;

        let maxThreshold = ChunkLoader.serverLoadingRadius;

        return ChunkBuilder.getOOBPlayerChunks(player, starterChunk, consistencyModel, maxThreshold);
    }

}

export default ChunkLoader;
