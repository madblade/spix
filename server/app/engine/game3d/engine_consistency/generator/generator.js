/**
 * Create and fill chunks.
 */

'use strict';

import WorldGenerator       from './worldgenerator';
import ChunkBuilder         from '../builder/builder_chunks';

class Generator {

    constructor(consistencyEngine) {
        this._worldModel = consistencyEngine.worldModel;
    }

    generateWorld() {
        let wm = this._worldModel;

        // TODO [LOW] chrono and time out.
        return new Promise(resolve => {

            // Generate blocks.
            let x = wm.xSize, y = wm.ySize, z = wm.zSize;
            var chunkMap = WorldGenerator.generateFlatWorld(x, y, z, wm);

            // Affect chunks.
            this._worldModel.allChunks = chunkMap;

            // Finalize chunks (extract surface faces).
            var chunks = new Map(chunkMap); // Shallow copy.
            // Adds chunks in worldModel, so mutable chunkMapCollection does not fit.
            chunks.forEach((chunk, id) => ChunkBuilder.computeChunkFaces(chunk));

            // Notify
            resolve();
        });
    }

}

export default Generator;
