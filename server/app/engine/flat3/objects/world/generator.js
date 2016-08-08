/**
 *
 */

'use strict';

import WorldFactory from './factory';

class Generator {

    static generateFlatWorld(chunkSizeX, chunkSizeY, chunkSizeZ, worldManager) {
        return {
            '0,0':      Generator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0, worldManager)
        };
    }

    static generateFlatChunk(x, y, z, i, j, worldManager) {
        let id = i+','+j;
        return WorldFactory.createRawChunk(x, y, z, id, worldManager);
    }

    static generatePerlinWorld() {
        return {};
    }

}

export default Generator;
