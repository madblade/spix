/**
 *
 */

'use strict';

import WorldFactory from './factory';

class Generator {

    static generateFlatWorld(chunkSizeX, chunkSizeY, chunkSizeZ) {
        return {
            '0,0': Generator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0)
            // ,
            //'0,-1': Generator.generateFlatChunk(8, 8, 256, '0,-1'),
            //'-1,0': Generator.generateFlatChunk(8, 8, 256, '-1,0'),
            //'-1,-1': Generator.generateFlatChunk(8, 8, 256, '-1,-1')
        };
    }

    static generateFlatChunk(x, y, z, i, j) {
        return WorldFactory.createChunk(x, y, z, i+','+j);
    }

    static generatePerlinWorld() {
        return {};
    }

}

export default Generator;
