/**
 *
 */

'use strict';

import ChunkGenerator from './chunkgenerator';

class WorldGenerator
{
    static generateInitialWorld(chunkSizeX, chunkSizeY, chunkSizeZ, world)
    {
        let worldMap = new Map();
        worldMap.set('0,0,0',
            WorldGenerator.generateInitialChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0, 0, world)
        );
        return worldMap;
    }

    static generateInitialChunk(x, y, z, i, j, k, world)
    {
        let id = `${i},${j},${k}`;
        return ChunkGenerator.createRawChunk(x, y, z, id, world);
    }

    static generatePerlinWorld()
    {
        return new Map();
    }
}

export default WorldGenerator;
