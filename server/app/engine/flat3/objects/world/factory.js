/**
 *
 */

'use strict';

import Chunk from './chunk';

class WorldFactory {

    static createChunk(x, y, z, id, worldManager) {
        return new Chunk(x, y, z, id, worldManager);
    }

}

export default WorldFactory;
