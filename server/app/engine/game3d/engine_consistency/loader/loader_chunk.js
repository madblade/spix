/**
 * Extract chunk surfaces and build hierarchy.
 */

'use strict';

import GeometryUtils        from '../../../math/geometry';

import WorldModel           from '../../model_world/model';
import WorldGenerator       from '../generator/worldgenerator';
// import ChunkIterator        from '../builder/iterator_chunks';
import ChunkBuilder         from '../builder/builder_chunks';
import TimeUtils from '../../../math/time';

class ChunkLoader {

    static debug = false;
    static load = true;
    static bench = false;

    constructor(consistencyEngine) {
        // Models.
        this._worldModel        = consistencyEngine.worldModel;
        this._consistencyModel  = consistencyEngine.consistencyModel;
        this._xModel            = consistencyEngine.xModel;
    }

    computeChunksForNewPlayer(player) {
        let avatar = player.avatar;
        let worldId = avatar.worldId;
        let world = this._worldModel.getWorld(worldId);

        // Object to be (JSON.stringify)-ed.
        let chunksForNewPlayer = {};
        let chunksInModel = world.allChunks;

        // From player position, find concerned chunks.
        const playerPosition = avatar.position;
        let coords = world.getChunkCoordinates(playerPosition[0], playerPosition[1], playerPosition[2]);

        const i = coords[0];
        const j = coords[1];
        const k = coords[2];
        const dx = world.xSize;
        const dy = world.ySize;
        const dz = world.zSize;
        let minChunkDistance = Number.POSITIVE_INFINITY;

        let chunkIds = [];
        chunkIds.push(`${i},${j},${k}`);

        for (let m = 0, length = chunkIds.length; m < length; ++m) {
            let currentChunkId = chunkIds[m];

            // Generate chunk.
            if (!chunksInModel.has(currentChunkId)) { // TODO [LOW] worldify or delegate to consistency updater (better).
                if (ChunkLoader.debug)
                    console.log(`We should generate ${currentChunkId} for the user.`);
                let chunk = WorldGenerator.generateInitialChunk(dx, dy, dz, currentChunkId, world);
                chunksInModel.set(currentChunkId, chunk);
            }

            // Extract surfaces.
            let currentChunk = chunksInModel.get(currentChunkId);
            if (!currentChunk.ready) {
                if (ChunkLoader.debug)
                    console.log(`We should extract faces from ${currentChunkId}.`);
                ChunkBuilder.computeChunkFaces(currentChunk);
            }

            // Test for distance.
            const ids = currentChunkId.split(',');
            const chunkPosition = [
                parseInt(ids[0], 10) * dx / 2,
                parseInt(ids[1], 10) * dy / 2,
                parseInt(ids[2], 10) * dz / 2
            ];
            const distance = GeometryUtils.chunkSquaredEuclideanDistance(chunkPosition, playerPosition);
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

    // THOUGHT [OPTIM] n nearest, 1 chunk per X.
    // no more than X chunk per player per iteration?
    computeNewChunksInRange(player) {
        if (!ChunkLoader.load) return;
        const avatar = player.avatar;

        let worldId = avatar.worldId;
        let world = this._worldModel.getWorld(worldId);
        let consistencyModel = this._consistencyModel;

        const pos = avatar.position;

        // Has nearest chunk changed?
        let coords = world.getChunkCoordinates(pos[0], pos[1], pos[2]);
        let nearestChunkId = `${coords[0]},${coords[1]},${coords[2]}`;
        // let formerNearestChunkId = avatar.nearestChunkId;

        // Get current chunk.
        let starterChunk = world.getChunkById(nearestChunkId);
        if (!starterChunk) {
            console.log('[WARN] Could not load chunk on which current entity is.');
            starterChunk = ChunkBuilder.addChunk(world.xSize, world.ySize, world.zSize, nearestChunkId, world);
            // return;
        }

        // Return variables.
        let newChunksForPlayer = {};
        let unloadedChunksForPlayer = {};

        // Case 1: need to load chunks up to R_i (inner circle)
        // and to unload from R_o (outer circle).
        if (!consistencyModel.doneChunkLoadingPhase(player, starterChunk)) {
            newChunksForPlayer = this.loadInnerSphere(player, starterChunk);
            // For (i,j,k) s.t. D = d({i,j,k}, P) < P.thresh, ordered by increasing D
                // if !P.has(i,j,k)
                    // Load (i,j,k) and break

            // unloadedChunksForPlayer = this.unloadInnerToOuterSphere(player, starterChunk);
            unloadedChunksForPlayer = this.unloadOuterSphere(player, starterChunk);
            // For (i,j,k) s.t. P.has(i,j,k)
                // if d({i,j,k}, P) > P.thresh
                    // Unload (i,j,k)
            avatar.nearestChunkId = nearestChunkId;
        }

        // THOUGHT [OPTIM] don't test when doneChunkLoadingPhase has been reached once, until (nearest !== formerNearest)
        // Case 2: if chunks were loaded up to R_i, but player walked
        // into another chunk. Need to ensure all chunks are loaded up to R_i
        // and every loaded chunk that happens to be outside R_o is unloaded.
        /*
        else if (nearestChunkId !== formerNearestChunkId) {

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
        */

        // No avatar position change, nothing to update.
        else {
            unloadedChunksForPlayer = this.unloadOuterSphere(player, starterChunk);
            return;
        }

        // Nothing to update.
        if (Object.keys(newChunksForPlayer).length < 1 &&
            Object.keys(unloadedChunksForPlayer).length < 1) return;

        return [newChunksForPlayer, unloadedChunksForPlayer];
    }

    loadInnerSphere(player, starterChunk) {
        // let worldId = player.avatar.worldId;
        let worldModel = this._worldModel;
        let xModel = this._xModel;
        let consistencyModel = this._consistencyModel;
        // TODO [HIGH] worldify think of another location for that
        // let world = worldModel.getWorld(worldId);
        let sRadius = WorldModel.serverLoadingRadius;

        let newChunksForPlayer = {};

        // Loading circle for server (a bit farther)
        let t = TimeUtils.getTimeSecNano();

        const wid = starterChunk.world.worldId;
        const cid = starterChunk.chunkId;
        ChunkBuilder.loadNextChunk(player, wid, cid, worldModel, xModel,
            consistencyModel, sRadius, false);

        let dt1 = TimeUtils.getTimeSecNano(t)[1] / 1000;
        if (ChunkLoader.bench && dt1 > 1000) console.log(`\t\t${dt1} preLoad ForServer.`);

        // Loading circle for client (nearer)
        // Only load one at a time!
        // TODO [HIGH] check on Z+/-.
        // TODO [LONG-TERM] enhance to transmit chunks when users are not so much active and so on.
        t = TimeUtils.getTimeSecNano();

        let newChunk = ChunkBuilder.loadNextChunk(player, wid, cid, worldModel, xModel,
            consistencyModel, sRadius, true);

        dt1 = TimeUtils.getTimeSecNano(t)[1] / 1000;
        if (ChunkLoader.bench && dt1 > 1000) console.log(`\t\t${dt1} preLoad ForPlayer.`);

        if (newChunk) {
            if (ChunkLoader.debug) console.log(`New chunk : ${newChunk.chunkId}`);
            // TODO [HIGH] not only one at a time
            newChunksForPlayer[newChunk.world.worldId] = {[newChunk.chunkId]: [newChunk.fastComponents, newChunk.fastComponentsIds]};
        }

        return newChunksForPlayer;
    }

    unloadInnerToOuterSphere(player, starterChunk) {
        let consistencyModel = this._consistencyModel;
        let worldModel = this._worldModel;
        let xModel = this._xModel;

        let minThreshold = player.avatar.chunkRenderDistance;
        let maxThreshold = WorldModel.serverLoadingRadius;
        minThreshold = Math.min(minThreshold, maxThreshold);

        return ChunkBuilder.getOOBPlayerChunks(player, starterChunk, worldModel, xModel, consistencyModel, minThreshold);
    }

    unloadOuterSphere(player, starterChunk) {
        let consistencyModel = this._consistencyModel;
        let worldModel = this._worldModel;
        let xModel = this._xModel;

        let maxThreshold = player.avatar.chunkUnloadDistance;

        return ChunkBuilder.getOOBPlayerChunks(player, starterChunk, worldModel, xModel, consistencyModel, maxThreshold);
    }

}

export default ChunkLoader;
