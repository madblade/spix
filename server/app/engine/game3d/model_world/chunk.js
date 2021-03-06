/**
 *
 */

'use strict';

import TimeUtils from '../../math/time';
import ChunkBuilder from '../engine_consistency/builder/builder_chunks';

class Chunk
{
    static debug = false;

    constructor(xSize, ySize, zSize, chunkId, world)
    {
        // App.
        this._world = world;

        // Dimensions, coordinates
        this._xSize = xSize;
        this._ySize = ySize;
        this._zSize = zSize;

        this._capacity = this._xSize * this._ySize * this._zSize;
        this._chunkId = chunkId;
        let ijk = chunkId.split(',');

        this._chunkI = parseInt(ijk[0], 10);
        this._chunkJ = parseInt(ijk[1], 10);
        this._chunkK = parseInt(ijk[2], 10);

        // Blocks.
        /** Flat array. x, then y, then z. */
        this._blocks = new Uint8Array(xSize * ySize * zSize);
        /** Nested z-array. (each z -> i×j layer, without primary offset) */
        this._surfaceBlocks = [];
        /** Each face -> index of its connected component. */
        this._connectedComponents = new Uint8Array();
        /**  Each connected component -> (sorted) list of face indices. */
        this._fastConnectedComponents = {};
        this._fastConnectedComponentsIds = {}; // Signed.

        this._neighborBlocksReady = false;
        this._blocksReady = false;
        this._ready = false;

        this.isEmpty = false;
        this.isFull = false;

        // Events.
        this._lastUpdated = TimeUtils.getTimeSecNano();
        this._updates = [{}, {}, {}];
    }

    // Getters
    get chunkI() { return this._chunkI; }
    get chunkJ() { return this._chunkJ; }
    get chunkK() { return this._chunkK; }
    get chunkId() { return this._chunkId; }
    get dimensions() { return [this._xSize, this._ySize, this._zSize]; }
    get capacity() { return this._capacity; }
    get blocks() { return this._blocks; }
    get surfaceBlocks() { return this._surfaceBlocks; }
    get fastComponents() { return this._fastConnectedComponents; }
    get fastComponentsIds() { return this._fastConnectedComponentsIds; }
    get connectedComponents() { return this._connectedComponents; }
    get updates() { return this._updates; }
    get world() { return this._world; }
    get ready() { return this._ready; }
    get blocksReady() { return this._blocksReady; }
    get neighborBlocksReady() { return this._neighborBlocksReady; }

    // Setters
    set blocks(newBlocks) { this._blocks = newBlocks; }
    set surfaceBlocks(newSurfaceBlocks) { this._surfaceBlocks = newSurfaceBlocks; }
    set fastComponents(newFastComponents) { this._fastConnectedComponents = newFastComponents; }
    set fastComponentsIds(newFastComponentsIds) { this._fastConnectedComponentsIds = newFastComponentsIds; }
    set connectedComponents(newConnectedComponents) { this._connectedComponents = newConnectedComponents; }
    set updates(newUpdates) { this._updates = newUpdates; }
    set ready(newReady) { this._ready = newReady; }
    set blocksReady(newReady) { this._blocksReady = newReady; }
    set neighborBlocksReady(newReady) { this._neighborBlocksReady = newReady; }

    // Do not use! Used for getting blocks that might exceed capacity.
    _toIdUnsafe(x, y, z)
    {
        return x + y * this._xSize + z * this._xSize * this._ySize;
    }

    _toId(x, y, z)
    {
        let id = x + y * this._xSize + z * this._xSize * this._ySize;
        if (id >= this._capacity)
        {
            console.log(`chunk._toId: invalid request coordinates: ${x},${y},${z} -> ${id}`);
            let e = new Error();
            console.log(e.stack);
        }
        return id;
    }

    what(x, y, z)
    {
        if (!this._blocksReady) return -1;
        let id = this._toId(x, y, z);
        if (id >= this._capacity || id < 0) return 0;
        return this._blocks[id];
    }

    /**
     * Do not use outside updater_block or updater_face.
     * Only queries Manhattan neighborhood, only with max offset of 1.
     */
    queryBlock(x, y, z)
    {
        if (!this.blocksReady) return -1;
        if (x >= 0 && y >= 0 && z >= 0 &&
            x < this._xSize && y < this._ySize && z < this._zSize)
        {
            let id = this._toId(x, y, z);
            if (id < this._capacity && id >= 0)
                return this._blocks[id];
        }
        let nc;
        if (x < 0) { // x-
            nc = ChunkBuilder.getNeighboringChunk(this, 1);
            if (!nc || !nc.blocksReady)
            {
                console.error('[QueryBlock] invalid rec.');
                return -1;
            }
            return nc.queryBlock(x + this._xSize, y, z);
        } else if (x >= this._xSize) { // x+
            nc = ChunkBuilder.getNeighboringChunk(this, 0);
            if (!nc || !nc.blocksReady)
            {
                console.error('[QueryBlock] invalid rec.');
                return -1;
            }
            return nc.queryBlock(x - this._xSize, y, z);
        } else if (y < 0) { // y-
            nc = ChunkBuilder.getNeighboringChunk(this, 3);
            if (!nc || !nc.blocksReady)
            {
                console.error('[QueryBlock] invalid rec.');
                return -1;
            }
            return nc.queryBlock(x, y + this._ySize, z);
        } else if (y >= this._ySize) { // y+
            nc = ChunkBuilder.getNeighboringChunk(this, 2);
            if (!nc || !nc.blocksReady)
            {
                console.error('[QueryBlock] invalid rec.');
                return -1;
            }
            return nc.queryBlock(x, y - this._ySize, z);
        } else if (z < 0) { // z-
            nc = ChunkBuilder.getNeighboringChunk(this, 5);
            if (!nc || !nc.blocksReady)
            {
                console.error('[QueryBlock] invalid rec.');
                return -1;
            }
            return nc.queryBlock(x, y, z + this._zSize);
        } else if (z >= this._zSize) { // z+
            nc = ChunkBuilder.getNeighboringChunk(this, 4);
            if (!nc || !nc.blocksReady)
            {
                console.error('[QueryBlock] invalid rec.');
                return -1;
            }
            return nc.queryBlock(x, y, z - this._zSize);
        }
    }

    queryChunk(x, y, z)
    {
        if (x >= 0 && y >= 0 && z >= 0 &&
            x < this._xSize && y < this._ySize && z < this._zSize)
        {
            let id = this._toId(x, y, z);
            if (id < this._capacity && id >= 0)
                return [this, x, y, z];
        }
        let nc;
        if (x < 0) { // x-
            nc = ChunkBuilder.getNeighboringChunk(this, 1);
            if (!nc)
            {
                console.error('[QueryBlock] invalid rec.');
                return;
            }
            return [nc, x + this._xSize, y, z];
        } else if (x >= this._xSize) { // x+
            nc = ChunkBuilder.getNeighboringChunk(this, 0);
            if (!nc)
            {
                console.error('[QueryBlock] invalid rec.');
                return;
            }
            return [nc, x - this._xSize, y, z];
        } else if (y < 0) { // y-
            nc = ChunkBuilder.getNeighboringChunk(this, 3);
            if (!nc)
            {
                console.error('[QueryBlock] invalid rec.');
                return;
            }
            return [nc, x, y + this._ySize, z];
        } else if (y >= this._ySize) { // y+
            nc = ChunkBuilder.getNeighboringChunk(this, 2);
            if (!nc)
            {
                console.error('[QueryBlock] invalid rec.');
                return;
            }
            return [nc, x, y - this._ySize, z];
        } else if (z < 0) { // z-
            nc = ChunkBuilder.getNeighboringChunk(this, 5);
            if (!nc)
            {
                console.error('[QueryBlock] invalid rec.');
                return;
            }
            return [nc, x, y, z + this._zSize];
        } else if (z >= this._zSize) { // z+
            nc = ChunkBuilder.getNeighboringChunk(this, 4);
            if (!nc)
            {
                console.error('[QueryBlock] invalid rec.');
                return;
            }
            return [nc, x, y, z - this._zSize];
        }
    }

    contains(x, y, z)
    {
        return this.what(x, y, z) !== 0;
    }

    getNeighbourChunkFromRelativeCoordinates(x, y, z)
    {
        let neighbourChunkI;
        let neighbourChunkJ;
        let neighbourChunkK;
        let xS = this._xSize;
        let yS = this._ySize;
        let zS = this._zSize;
        let ci = this._chunkI;
        let cj = this._chunkJ;
        let ck = this._chunkK;
        let world = this._world;

        if (x < 0)          neighbourChunkI = ci - 1;
        else if (x >= xS)   neighbourChunkI = ci + 1;
        else                neighbourChunkI = ci;

        if (y < 0)          neighbourChunkJ = cj - 1;
        else if (y >= yS)   neighbourChunkJ = cj + 1;
        else                neighbourChunkJ = cj;

        if (z < 0)          neighbourChunkK = ck - 1;
        else if (z >= zS)   neighbourChunkK = ck + 1;
        else                neighbourChunkK = ck;

        return world.getChunk(neighbourChunkI, neighbourChunkJ, neighbourChunkK);
    }

    // Mustn't exceed negative [xyz] Size
    neighbourWhat(x, y, z)
    {
        let localX;
        let localY;
        let localZ;
        let xS = this._xSize;
        let yS = this._ySize;
        let zS = this._zSize;

        if (x < 0)          localX = xS + x;
        else if (x >= xS)   localX = x % xS;
        else                localX = x;

        if (y < 0)          localY = yS + y;
        else if (y >= yS)   localY = y % yS;
        else                localY = y;

        if (z < 0)          localZ = zS + z;
        else if (z >= zS)   localZ = z % zS;
        else                localZ = z;

        const nChunk = this.getNeighbourChunkFromRelativeCoordinates(x, y, z);
        return nChunk.what(localX, localY, localZ);
    }

    neighbourContains(x, y, z)
    {
        return this.neighbourWhat(x, y, z) !== 0;
    }

    add(x, y, z, blockId)
    {
        let id = this._toId(x, y, z);
        if (id >= this._capacity) return;

        // Update blocks, surface blocks, then surface faces.
        this._blocks[id] = blockId;
        return id;
    }

    del(x, y, z)
    {
        let id = this._toId(x, y, z);
        if (id >= this._capacity) return;

        // Update blocks, surface blocks, then surface faces.
        this._blocks[id] = 0;
        return id;
    }

    flushUpdates()
    {
        this._updates = [{}, {}, {}];
    }
}

export default Chunk;
