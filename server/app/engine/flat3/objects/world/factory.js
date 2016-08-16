/**
 *
 */

'use strict';

import Chunk from './chunk';
import ExtractionAPI from './extraction/extractionapi';

class WorldFactory {

    static createRawChunk(x, y, z, id, worldManager) {
        return new Chunk(x, y, z, id, worldManager);
    }

    static createChunk(x, y, z, id, worldManager) {
        var c = new Chunk(x, y, z, id, worldManager);
        ExtractionAPI.computeChunkFaces(c);
        return c;
    }

}

export default WorldFactory;
