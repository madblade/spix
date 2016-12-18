/**
 *
 */

'use strict';

import ChunkGenerator from './../generator/chunkgenerator';
import ExtractAPI from './../builder/extractionapi';

class ChunkLoader {

    static debug = false;

    static serverLoadingRadius = 10;
    static clientLoadingRadius = 2;
    static clientUnloadingRadius = 20;

    /** MODEL
     0	i+1,	j,		k
     1	i-1,	j,		k
     2	i,		j+1,	k
     3	i,		j-1,	k
     4	i,		j,		k+1
     5	i,		j,		k-1
     6	i+1,	j+1,	k
     7	i-1,	j+1,	k
     8	i+1,	j-1,	k
     9	i-1,	j-1,	k
     10	i+1,	j,		k-1
     11	i+1,	j,		k+1
     12	i-1,	j,		k-1
     13	i-1,	j,		k+1
     14	i,		j+1,	k+1
     15	i,		j-1,	k+1
     16	i,		j+1,	k-1
     17	i,		j-1,	k-1
    */
    static getNeighboringChunk(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let wm = chunk.manager;

        switch (direction) {
            case 0: // x+
                return wm.getChunk(i+1, j, k);
            case 1: // x-
                return wm.getChunk(i-1, j, k);
            case 2: // y+
                return wm.getChunk(i, j+1, k);
            case 3: // y-
                return wm.getChunk(i, j-1, k);
            case 4: // z+
                return wm.getChunk(i, j, k+1);
            case 5: // z- (idem)
                return wm.getChunk(i, j, k-1);
            case 6:
                return wm.getChunk(i+1, j+1, k);
            case 7:
                return wm.getChunk(i-1, j+1, k);
            case 8:
                return wm.getChunk(i+1, j-1, k);
            case 9:
                return wm.getChunk(i-1, j-1, k);
            case 10:
                return wm.getChunk(i+1, j, k-1);
            case 11:
                return wm.getChunk(i+1, j, k+1);
            case 12:
                return wm.getChunk(i-1, j, k-1);
            case 13:
                return wm.getChunk(i-1, j, k+1);
            case 14:
                return wm.getChunk(i, j+1, k+1);
            case 15:
                return wm.getChunk(i, j-1, k+1);
            case 16:
                return wm.getChunk(i, j+1, k-1);
            case 17:
                return wm.getChunk(i, j-1, k-1);
            default:
        }
    }

    static isNeighboringChunkLoaded(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let wm = chunk.manager;

        switch (direction) {
            case 0: // x+
                return wm.isChunkLoaded(i+1, j, k);
            case 1: // x-
                return wm.isChunkLoaded(i-1, j, k);
            case 2: // y+
                return wm.isChunkLoaded(i, j+1, k);
            case 3: // y-
                return wm.isChunkLoaded(i, j-1, k);
            case 4: // z+ (non-flat models)
                return wm.isChunkLoaded(i, j, k+1);
            case 5: // z-
                return wm.isChunkLoaded(i, j, k-1);
            case 6:
                return wm.isChunkLoaded(i+1, j+1, k);
            case 7:
                return wm.isChunkLoaded(i-1, j+1, k);
            case 8:
                return wm.isChunkLoaded(i+1, j-1, k);
            case 9:
                return wm.isChunkLoaded(i-1, j-1, k);
            case 10:
                return wm.isChunkLoaded(i+1, j, k-1);
            case 11:
                return wm.isChunkLoaded(i+1, j, k+1);
            case 12:
                return wm.isChunkLoaded(i-1, j, k-1);
            case 13:
                return wm.isChunkLoaded(i-1, j, k+1);
            case 14:
                return wm.isChunkLoaded(i, j+1, k+1);
            case 15:
                return wm.isChunkLoaded(i, j-1, k+1);
            case 16:
                return wm.isChunkLoaded(i, j+1, k-1);
            case 17:
                return wm.isChunkLoaded(i, j-1, k-1);
            default:
        }
    }

    static preloadAllNeighbourChunks(chunk, worldModel) {
        let loadedChunks = worldModel.allChunks;
        let c = chunk;
        let ci = c.chunkI;
        let cj = c.chunkJ;
        let ck = c.chunkK;
        let dims = c.dimensions;

        let neighbourIds = [
            (ci+1)+','+cj+','+ck,           //  i+1,	j,		k
            ci+','+(cj+1)+','+ck,           //  i-1,	j,		k
            ci+','+cj+','+(ck+1),           //  i,		j+1,	k
            (ci-1)+','+cj+','+ck,           //  i,		j-1,	k
            ci+','+(cj-1)+','+ck,           //  i,		j,		k+1
            ci+','+cj+','+(ck-1),           //  i,		j,		k-1
            (ci+1)+','+(cj+1)+','+(ck),     //  i+1,	j+1,	k
            (ci-1)+','+(cj+1)+','+(ck),     //  i-1,	j+1,	k
            (ci+1)+','+(cj-1)+','+(ck),     //  i+1,	j-1,	k
            (ci-1)+','+(cj-1)+','+(ck),     //  i-1,	j-1,	k
            (ci+1)+','+(cj)+','+(ck-1),     //  i+1,	j,		k-1
            (ci+1)+','+(cj)+','+(ck+1),     //  i+1,	j,		k+1
            (ci-1)+','+(cj)+','+(ck-1),     //  i-1,	j,		k-1
            (ci-1)+','+(cj)+','+(ck+1),     //  i-1,	j,		k+1
            (ci)+','+(cj+1)+','+(ck+1),     //  i,		j+1,	k+1
            (ci)+','+(cj-1)+','+(ck+1),     //  i,		j-1,	k+1
            (ci)+','+(cj+1)+','+(ck-1),     //  i,		j+1,	k-1
            (ci)+','+(cj-1)+','+(ck-1)      //  i,		j-1,	k-1
        ];

        for (let i = 0, length = neighbourIds.length; i < length; ++i) {
            let currentId = neighbourIds[i];
            if (loadedChunks.has(currentId)) continue;

            // Don't compute faces
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, worldModel);
            worldModel.addChunk(currentId, neighbour);
        }
    }

    static preloadFlatNeighbourChunks(chunk, worldModel) {
        let loadedChunks = worldModel.allChunks;
        let c = chunk;
        let ci = c.chunkI;
        let cj = c.chunkJ;
        let ck = c.chunkK;
        let dims = c.dimensions;

        let neighbourIds = [
            (ci+1)+','+cj+','+ck,
            ci+','+(cj+1)+','+ck,
            ci+','+cj+','+(ck+1),
            (ci-1)+','+cj+','+ck,
            ci+','+(cj-1)+','+ck,
            ci+','+cj+','+(ck-1)
        ];

        for (let i = 0, length = neighbourIds.length; i < length; ++i) {
            let currentId = neighbourIds[i];
            if (loadedChunks.has(currentId)) continue;

            // Don't compute faces
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, worldModel);
            worldModel.addChunk(currentId, neighbour);
        }
    }

    static addChunk(dimX, dimY, dimZ, chunkId, worldModel) {
        // Do compute faces
        let chunk = ChunkGenerator.createChunk(dimX, dimY, dimZ, chunkId, worldModel);
        worldModel.addChunk(chunkId, chunk);
        ExtractAPI.computeChunkFaces(chunk);
        return chunk;
    }

    static preLoadNextChunk(player, chunk, worldModel, forPlayer) {
        const threshold = forPlayer ? ChunkLoader.clientLoadingRadius : ChunkLoader.serverLoadingRadius;

        // Get nearest, load.
        let avatar = player.avatar;
        let allChunks = worldModel.allChunks;

        const dx = worldModel.chunkDimensionX;
        const dy = worldModel.chunkDimensionY;
        const dz = worldModel.chunkDimensionZ;

        const ci = chunk.chunkI;
        const cj = chunk.chunkJ;
        const ck = chunk.chunkK;

        let i = ci;
        let j = cj;
        let k = ck; // TODO algorithmical zeefication

        let depth = 0;
        let foundUnloadedChunk = false;

        // Testing nearest chunks with Manhattan distance.
        // Weakness: assert cannot be loaded if !exists in model
        while (!foundUnloadedChunk && depth <= threshold) {
            ++depth;

            for (let delta = -depth; delta < depth; ++delta) {
                if (
                    !avatar.isChunkLoaded((i+delta)+','+(j+depth)+','+k) ||
                    !avatar.isChunkLoaded((i+delta)+','+(j-depth)+','+k) ||
                    !avatar.isChunkLoaded((i+depth)+','+(j+delta)+','+k) ||
                    !avatar.isChunkLoaded((i-depth)+','+(j+delta)+','+k)
                )
                {
                    foundUnloadedChunk = true;
                    break;
                }
            }

        }

        i = ci;
        j = cj;
        k = ck;

        // Check if everything is loaded.
        let res = null;
        if (depth > threshold) return res;

        function chunkIsToBeLoaded(ic, jc, kc) {
            let currentId = ic+','+jc+','+kc;
            let currentChunk = allChunks.get(currentId);

            if (!forPlayer) {
                if (!currentChunk) {
                    return ChunkLoader.addChunk(dx, dy, dz, currentId, worldModel);
                } else if (!currentChunk.ready) {
                    ExtractAPI.computeChunkFaces(currentChunk);
                    return currentChunk;
                } else return null;
            } else {
                if (!avatar.isChunkLoaded(currentId)) {
                    return currentChunk;
                } else return null;
            }
        }

        // 2D check.

        // Back case
        res = chunkIsToBeLoaded((i-depth), j, k);
        if (res !== null) {
            if (ChunkLoader.debug) if (forPlayer) console.log("BACK CASE");
            return res;
        }

        // Back segment
        for (let nj = 1; nj <= depth; ++nj) {
            res = chunkIsToBeLoaded(i-depth, j+nj, k);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("BACK SEG+");
                return res;
            }

            res = chunkIsToBeLoaded(i-depth, j-nj, k);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("BACK SEG-");
                return res;
            }
        }

        // Side segments
        for (let ni = -depth; ni <= depth; ++ni) {
            res = chunkIsToBeLoaded(i+ni, j-depth, k);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("SIDE SEG i-");
                return res;
            }
            res = chunkIsToBeLoaded(i+ni, j+depth, k);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("SIDE SEG i+");
                return res;
            }
        }

        // Front segment
        for (let nj = -depth; nj < 0; ++nj) {
            res = chunkIsToBeLoaded(i+depth, j-nj, k);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("FRONT SEG-");
                return res;
            }
            res = chunkIsToBeLoaded(i+depth, j+nj, k);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("FRONT SEG+");
                return res;
            }
        }

        // Last case
        res = chunkIsToBeLoaded((i+depth), j, k);
        if (res !== null) {
            if (ChunkLoader.debug) if (forPlayer) console.log("CURRENT FINALLY");
            return res;
        }
    }

    static getNextPlayerChunk(player, chunk, worldModel) {
        // Get nearest unloaded until threshold, send back.

        return ChunkLoader.preLoadNextChunk(player, chunk, worldModel, true);
    }

    static getOOBPlayerChunks(player, chunk, worldModel) {
        var oobChunks = [];
        // TODO check implementation

        // Recurse on loaded chunks.

        return oobChunks;
    }

}

export default ChunkLoader;
