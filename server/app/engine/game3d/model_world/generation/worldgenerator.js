/**
 *
 */

'use strict';

import ChunkGenerator from './chunkgenerator';

class WorldGenerator {

    static generateFlatWorld(chunkSizeX, chunkSizeY, chunkSizeZ, worldModel) {
        var world = new Map();
        world.set('0,0,0', WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0, 0, worldModel));
        return world;
        /*return {
            '0,0,0':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0, 0, worldModel),
            '-1,0':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, -1, 0, 0, worldModel),
            '0,-1':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, -1, 0, worldModel),
            '0,1':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 1, 0, worldModel),
            '1,0':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 1, 0, 0, worldModel)
        };*/
    }

    static generateFlatChunk(x, y, z, i, j, k, worldModel) {
        let id = i+','+j+','+k;
        return ChunkGenerator.createRawChunk(x, y, z, id, worldModel);
    }

    static generatePerlinWorld() {
        return new Map();
    }

}

export default WorldGenerator;
