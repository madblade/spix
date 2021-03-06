/**
 *
 */

'use strict';

import {
    BlockType, ChunkSizes, WorldType
} from './model';

class World
{
    constructor(id, worldInfo, worldModel)
    {
        this._worldId = id; // Identifier
        this._worldModel = worldModel;
        this._worldInfo = {
            hills: worldInfo.hills,
            trees: worldInfo.trees,
            type: worldInfo.kind,

            // Only for CubeWorld
            radius: worldInfo.sideSize,
            center: {x: 0, y: 0, z: -worldInfo.sideSize},
        };

        // Chunk id (i+','+j+','+k) -> chunk
        this._chunks = new Map();

        let chunkSizes = worldInfo.chunkSizes || ChunkSizes.CUBE_SMALL;
        // Constants
        this._xSize = chunkSizes[0] * 2;
        this._ySize = chunkSizes[1] * 2;
        this._zSize = chunkSizes[2] * 2;
        if (this._xSize % 2 !== 0 || this._ySize % 2 !== 0 || this._zSize % 2 !== 0)
        {
            console.error('World creation: chunk sizes must be even.');
        }

        this._waitingChunks = [];
        this._lastQueriedChunk = null;
    }

    get worldId() { return this._worldId; }
    // get worldType() { return this._worldType; }
    get worldInfo() { return this._worldInfo; }
    isFlat()
    {
        return this._worldInfo.type === WorldType.FLAT ||
            this._worldInfo.type === WorldType.FANTASY;
    }

    get xSize() { return this._xSize; }
    get ySize() { return this._ySize; }
    get zSize() { return this._zSize; }

    get allChunks() { return this._chunks; }
    set allChunks(newChunks) { this._chunks = newChunks; }

    pushChunkForGeneration(chunkId)
    {
        this._waitingChunks.push(chunkId);
    }

    getNextChunkForGeneration()
    {
        const l = this._waitingChunks.length;
        if (l < 0) return null;
        const cid = this._waitingChunks[l - 1];
        return this._chunks.get(cid);
    }

    popChunkForGeneration()
    {
        // const cid =
        this._waitingChunks.pop();
        // if (!cid) return null;
        // return this._chunks.get(cid);
    }

    addChunk(id, chunk)
    {
        this._chunks.set(id, chunk);
    }

    getChunkCoordinates(x, y, z)
    {
        let f = Math.floor;
        const dx = this.xSize;
        const dy = this.ySize;
        const dz = this.zSize;
        return [f(x / dx), f(y / dy), f(z / dz)];
    }

    getChunkByCoordinates(x, y, z)
    {
        let c = this.getChunkCoordinates(x, y, z);
        return this.getChunk(...c);
    }

    whatBlock(x, y, z)
    {
        let coords = this.getChunkCoordinates(x, y, z);

        const dx = this.xSize;
        const dy = this.ySize;
        const dz = this.zSize;
        const i = coords[0];
        const j = coords[1];
        const k = coords[2];

        const chunkX = x - i * dx;
        const chunkY = y - j * dy;
        const chunkZ = z - k * dz;

        const chunkId = `${i},${j},${k}`;
        let lastQueried = this._lastQueriedChunk;
        let chunk = lastQueried && lastQueried.chunkId === chunkId ?
            lastQueried :
            this._chunks.get(chunkId);

        if (!chunk || !chunk.blocksReady)
        {
            // console.log(
            //     `ChkMgr@whatBlock: could not find chunk
            //     ${chunkId} from (${x},${y},${z})!`
            // );
            return -1;
        } else {
            this._lastQueriedChunk = chunk;
        }

        return chunk.what(chunkX, chunkY, chunkZ);
    }

    getFreePosition()
    {
        // return [-100, 187, 18];
        let zLimit = this._zSize;
        let z = zLimit - 2;
        let centerInteger = Math.trunc(zLimit / 2); // parseInt(zLimit / 2, 10);
        let centerFloat = zLimit / 2 + 0.01; // parseFloat(zLimit / 2) + 0.01;
        let currentBlock = this.whatBlock(centerInteger, centerInteger, z - 1);
        if (currentBlock < 0)
        {
            // Chunk not ready yet.
            return null;
        }

        let nextBlock;
        while (
            (
                currentBlock !== BlockType.AIR ||
                (nextBlock = this.whatBlock(centerInteger, centerInteger, z)) !== 0
            ) &&
            z < 5 * zLimit) // check 2 chunks and abort
        {
            ++z;
            currentBlock = nextBlock;
        }
        return [centerFloat, centerFloat, z];
    }

    getChunk(iCoordinate, jCoordinate, kCoordinate)
    {
        let id = `${iCoordinate},${jCoordinate},${kCoordinate}`;
        return this._chunks.get(id);
    }

    getChunkById(chunkId)
    {
        return this._chunks.get(chunkId);
    }

    hasChunkById(chunkId)
    {
        return this._chunks.has(chunkId);
    }

    hasChunk(i, j, k)
    {
        return !!this.getChunk(i, j, k);
    }

    isWater(p0, p1, p2)
    {
        const n = this.whatBlock(Math.floor(p0), Math.floor(p1), Math.floor(p2));
        return n === BlockType.WATER;
    }

    isFree(p0, p1, p2)
    {
        const n = this.whatBlock(p0, p1, p2);
        return n === BlockType.AIR || n === BlockType.WATER;
        // && this.whatBlock(p[0], p[1], p[2]+1) === 0;
    }
}

export default World;
