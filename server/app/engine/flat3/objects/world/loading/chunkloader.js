/**
 *
 */

'use strict';

import ChunkGenerator from './../generation/chunkgenerator';

class ChunkLoader {

    static serverLoadingRadius = 5;
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

    // TODO
    static preLoadNextChunk(player, chunk, worldManager) {
        // Get nearest, load.
    }

    static getNextPlayerChunk(player, chunk, worldManager) {
        var nextPlayerChunk = null;
        // Get nearest unloaded until threshold, send back.

        return nextPlayerChunk;
    }

    static getOOBPlayerChunks(player, chunk, worldManager) {
        var oobChunks = [];
        return oobChunks;
    }

}

export default ChunkLoader;
