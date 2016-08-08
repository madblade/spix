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

    preLoadNeighborChunks() {
        let loadedChunks = this._worldManager.allChunks;
        let c = this._chunk;
        let i = c.chunkI;
        let j = c.chunkJ;

        let neighborIds = [(i+1)+','+j, i+','+(j+1), (i-1)+','+j, i+','+(j-1)];

        for (i = 0; i<neighborIds.length; ++i) {
            let currentId = neighborIds[i];
            if (!loadedChunks.hasOwnProperty(currentId)) {
                loadedChunks[currentId] = WorldFactory.createRawChunk(i, j, 0, currentId, this._worldManager);
            }
        }

    }

}

export default ChunkLoader;
