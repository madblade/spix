/**
 *
 */

'use strict';

import ChunkGenerator from './../generation/chunkgenerator';
import ExtractAPI from './../extraction/extractionapi';

class ChunkLoader {

    static debug = false;

    static serverLoadingRadius = 9;
    static clientLoadingRadius = 2;
    static clientUnloadingRadius = 5;

    static getNeighboringChunk(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let wm = chunk.manager;

        switch (direction) {
            case 0: // x+
                return wm.getChunk(i+1, j);
            case 1: // x-
                return wm.getChunk(i-1, j);
            case 2: // y+
                return wm.getChunk(i, j+1);
            case 3: // y-
                return wm.getChunk(i, j-1);
            // TODO zeefy (non-flat models)
            case 4: // z+
            case 5: // z- (idem)
                return null;
            default:
        }
    }

    static isNeighboringChunkLoaded(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let wm = chunk.manager;

        switch (direction) {
            case 0: // x+
                return wm.isChunkLoaded(i+1, j);
            case 1: // x-
                return wm.isChunkLoaded(i-1, j);
            case 2: // y+
                return wm.isChunkLoaded(i, j+1);
            case 3: // y-
                return wm.isChunkLoaded(i, j-1);
            case 4: // z+ (non-flat models)
            case 5: // z-
                return false;
            default:
        }
    }

    static preLoadNeighborChunks(chunk, worldManager) {
        let loadedChunks = worldManager.allChunks;
        let c = chunk;
        let ci = c.chunkI;
        let cj = c.chunkJ;
        let dims = c.dimensions;

        let neighbourIds = [(ci+1)+','+cj, ci+','+(cj+1), (ci-1)+','+cj, ci+','+(cj-1)];

        for (let i = 0, length = neighbourIds.length; i < length; ++i) {
            let currentId = neighbourIds[i];
            if (loadedChunks.hasOwnProperty(currentId)) continue;

            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, worldManager);

            //neighbour.fillChunk(64, 1);
            worldManager.addChunk(currentId, neighbour);
        }
    }

    static addChunk(dimX, dimY, dimZ, chunkId, worldManager) {
        let chunk = ChunkGenerator.createChunk(dimX, dimY, dimZ, chunkId, worldManager);
        worldManager.addChunk(chunkId, chunk);
        ExtractAPI.computeChunkFaces(chunk);
        return chunk;
    }

    // TODO zeefication
    static preLoadNextChunk(player, chunk, worldManager, forPlayer) {
        const threshold = forPlayer ? ChunkLoader.clientLoadingRadius : ChunkLoader.serverLoadingRadius;

        // Get nearest, load.
        let avatar = player.avatar;
        let allChunks = worldManager.allChunks;

        const dx = worldManager.chunkDimensionX;
        const dy = worldManager.chunkDimensionY;
        const dz = worldManager.chunkDimensionZ;

        const ci = chunk.chunkI;
        const cj = chunk.chunkJ;

        let i = ci;
        let j = cj;
        let depth = 0;
        let foundUnloadedChunk = false;

        // Testing nearest chunks with Manhattan distance.
        // Weakness: assert cannot be loaded if !exists in model
        while (!foundUnloadedChunk && depth <= threshold) {
            ++depth;

            for (let delta = -depth; delta < depth; ++delta) {
                if (
                    !avatar.isChunkLoaded((i+delta)+','+(j+depth)) ||
                    !avatar.isChunkLoaded((i+delta)+','+(j-depth)) ||
                    !avatar.isChunkLoaded((i+depth)+','+(j+delta)) ||
                    !avatar.isChunkLoaded((i-depth)+','+(j+delta))
                )
                {
                    foundUnloadedChunk = true;
                    break;
                }
            }

        }

        i = ci;
        j = cj;

        // Check if everything is loaded.
        let res = null;
        if (depth > threshold) return res;

        function chunkIsToBeLoaded(ic, jc) {
            let currentId = ic+','+jc;
            let currentChunk = allChunks[currentId];

            if (!forPlayer) {
                if (!currentChunk) {
                    return ChunkLoader.addChunk(dx, dy, dz, currentId, worldManager);
                } else if (!currentChunk.ready) {
                    ExtractAPI.computeChunkFaces(currentChunk);
                    return allChunks[currentId];
                } else return null;
            } else {
                if (!avatar.isChunkLoaded(currentId)) {
                    return allChunks[currentId];
                } else return null;
            }
        }

        // 2D check.

        // Back case
        res = chunkIsToBeLoaded((i-depth), j);
        if (res !== null) {
            if (ChunkLoader.debug) if (forPlayer) console.log("BACK CASE");
            return res;
        }

        // Back segment
        for (let nj = 1; nj <= depth; ++nj) {
            res = chunkIsToBeLoaded(i-depth, j+nj);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("BACK SEG+");
                return res;
            }

            res = chunkIsToBeLoaded(i-depth, j-nj);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("BACK SEG-");
                return res;
            }
        }

        // Side segments
        for (let ni = -depth; ni <= depth; ++ni) {
            res = chunkIsToBeLoaded(i+ni, j-depth);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("SIDE SEG i-");
                return res;
            }
            res = chunkIsToBeLoaded(i+ni, j+depth);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("SIDE SEG i+");
                return res;
            }
        }

        // Front segment
        for (let nj = -depth; nj < 0; ++nj) {
            res = chunkIsToBeLoaded(i+depth, j-nj);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("FRONT SEG-");
                return res;
            }
            res = chunkIsToBeLoaded(i+depth, j+nj);
            if (res !== null) {
                if (ChunkLoader.debug) if (forPlayer) console.log("FRONT SEG+");
                return res;
            }
        }

        // Last case
        res = chunkIsToBeLoaded((i+depth), j);
        if (res !== null) {
            if (ChunkLoader.debug) if (forPlayer) console.log("CURRENT FINALLY");
            return res;
        }
    }

    static getNextPlayerChunk(player, chunk, worldManager) {
        // Get nearest unloaded until threshold, send back.

        return ChunkLoader.preLoadNextChunk(player, chunk, worldManager, true);
    }

    static getOOBPlayerChunks(player, chunk, worldManager) {
        var oobChunks = [];

        // Recurse on loaded chunks.

        return oobChunks;
    }

}

export default ChunkLoader;
