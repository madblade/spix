/**
 *
 */

'use strict';

import WorldFactory from './factory';

class ChunkLoader {

    constructor(chunk, worldManager) {
        this._chunk = chunk;
        this._worldManager = worldManager;
    }

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
            case 4: // z+ (to be implemented in non-flat models)
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

    preLoadNeighborChunks() {
        let loadedChunks = this._worldManager.allChunks;
        let c = this._chunk;
        let i = c.chunkI;
        let j = c.chunkJ;

        let neighborIds = [(i+1)+','+j, i+','+(j+1), (i-1)+','+j, i+','+(j-1)];

        for (i = 0; i<neighborIds.length; ++i) {
            let currentId = neighborIds[i];
            if (loadedChunks.hasOwnProperty(currentId)) continue;
            this._worldManager.addChunk(currentId, WorldFactory.createRawChunk(i, j, 0, currentId, this._worldManager));
        }

    }

}

export default ChunkLoader;
