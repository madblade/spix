/**
 *
 */

'use strict';

import Chunk from './chunk';

class WorldFactory {

    static createChunk(x, y, z, id) {
        return new Chunk(x, y, z, id);
    }

}

export default WorldFactory;
