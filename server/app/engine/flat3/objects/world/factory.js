/**
 *
 */

'use strict';

import Chunk from './chunk';

class WorldFactory {

    static createRawChunk(x, y, z, id, worldManager) {
        return new Chunk(x, y, z, id, worldManager);
    }

    static createChunk(x, y, z, id, worldManager) {
        var c = new Chunk(x, y, z, id, worldManager);
        c.computeFaces();
        return c;
    }

}

export default WorldFactory;
