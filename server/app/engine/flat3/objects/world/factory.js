/**
 *
 */

'use strict';

import Chunk from './chunk';

class WorldFactory {

    static createChunk() {
        return new Chunk();
    }

}

export default WorldFactory;
