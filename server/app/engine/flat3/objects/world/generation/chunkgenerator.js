/**
 *
 */

'use strict';

import Chunk from './../chunk';
import ExtractionAPI from './../extraction/extractionapi';

class ChunkGenerator {

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call ExtractionAPI.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, worldManager) {
        var c = new Chunk(x, y, z, id, worldManager);

        // Flat homogeneous.
        c.fillChunk(48, 1);

        return c;
    }

    static createChunk(x, y, z, id, worldManager) {
        var c = new Chunk(x, y, z, id, worldManager);

        let generationMethod = worldManager.generationMethod;
        if (generationMethod == 'flat') {
            c.fillChunk(55, 1);
        } else {

        }

        return c;
    }

}

export default ChunkGenerator;
