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
        // TODO [MEDIUM] generate distinct worlds.
        let world = this._worldModel.getWorld();

        // TODO [LOW] chrono and time out.
        return new Promise(resolve =>
        {
            // Generate blocks.
            let x = world.xSize;
            let y = world.ySize;
            let z = world.zSize;
            let chunkMap = WorldGenerator.generateInitialWorld(x, y, z, world);

            // Affect chunks.
            world.allChunks = chunkMap;

            // Finalize chunks (extract surface faces).
            let chunks = new Map(chunkMap); // TODO Shallow copy instead.
            // Adds chunks in worldModel, so mutable chunkMapCollection does not fit.
            chunks.forEach(chunk/*, id)*/ => ChunkBuilder.computeChunkFaces(chunk));

            // Notify
            resolve();
        });
    }

}

export default Generator;
