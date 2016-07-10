/**
 *
 */

'use strict';

import WorldFactory from './factory';

class Generator {

    static generateFlatWorld(chunkSizeX, chunkSizeY, chunkSizeZ) {
        return {
            '0,0':      Generator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0),
            '0,-1':     Generator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, -1),
            '-1,0':     Generator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, -1, 0),
            '-1,-1':    Generator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, -1, -1)
        };
    }

    static generateFlatChunk(x, y, z, i, j) {
        let id = i;
        if (typeof j === "number") id += ','+j;
        return WorldFactory.createChunk(x, y, z, id);
    }

    static generatePerlinWorld() {
        return {};
    }

}

export default Generator;
