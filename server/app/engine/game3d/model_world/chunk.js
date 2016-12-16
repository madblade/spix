/**
 *
 */

'use strict';

import BlockExtractor from './extraction/chunkblockx';
import FaceExtractor from './extraction/chunkfacex';

import ChunkLoader from './loading/chunkloader';

class Chunk {

    static debug = false;

    constructor(xSize, ySize, zSize, chunkId, worldModel) {
        // App.
        this._worldModel = worldModel;

        // Dimensions, coordinates
        this._xSize = xSize;
        this._ySize = ySize;
        this._zSize = zSize;

        this._capacity = this._xSize * this._ySize * this._zSize;
        this._chunkId = chunkId;
        let ijk = chunkId.split(',');

        this._chunkI = parseInt(ijk[0]);
        this._chunkJ = parseInt(ijk[1]);
        this._chunkK = parseInt(ijk[2]);

        // Blocks.
        /** Flatten array. x, then y, then z. */
        this._blocks = new Uint8Array();
        /** Nested z-array. (each z -> i×j layer, without primary offset) */
        this._surfaceBlocks = {};
        /** Each face -> index of its connected component. */
        this._connectedComponents = new Uint8Array();
        /**  Each connected component -> (sorted) list of face indices. */
        this._fastConnectedComponents = {};
        this._fastConnectedComponentsIds = {}; // Signed.
        this._ready = false;

        // Events.
        this._lastUpdated = process.hrtime();
        this._updates = [{}, {}, {}];
    }

    computeFaces() {
        this.preloadNeighbourChunks();
        this.computeSurfaceBlocksFromScratch();
        this.computeConnectedComponents();
        this._ready = true;
        //console.log("Chunk " + this._chunkId + " ready.");
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
    get ready() { return this._ready; }
    get manager() { return this._worldModel; }

    // Setters
    set blocks(newBlocks) { this._blocks = newBlocks; }
    set surfaceBlocks(newSurfaceBlocks) { this._surfaceBlocks = newSurfaceBlocks; }
    set fastComponents(newFastComponents) { this._fastConnectedComponents = newFastComponents; }
    set fastComponentsIds(newFastComponentsIds) { this._fastConnectedComponentsIds = newFastComponentsIds; }
    set connectedComponents(newConnectedComponents) { this._connectedComponents = newConnectedComponents; }
    set updates(newUpdates) { this._updates = newUpdates; }

    /**
     * Preload neighbours.
     */
    preloadNeighbourChunks() {
        if (Chunk.debug) console.log('\tPreloading neighbor chunks...');
        ChunkLoader.preloadAllNeighbourChunks(this, this._worldModel);
    }

    /**
     * Detect boundary blocks.
     */
    computeSurfaceBlocksFromScratch() {
        if (Chunk.debug) console.log('\tExtracting surface...');
        try {
            BlockExtractor.extractSurfaceBlocks(this);
        } catch(err) {
            console.log(err.message);
        }
    }

    // Detect connected boundary face components.
    computeConnectedComponents() {
        if (Chunk.debug) console.log("\tComputing connected components...");
        try {
            FaceExtractor.extractConnectedComponents(this);
        } catch(err) {
            console.log("@ extracting connected components");
            console.log(err.message);
        }
    }

    _toId(x, y, z) {
        var id = x + y * this._xSize + z * this._xSize * this._ySize;
        if (id >= this._capacity) console.log("chunk._toId: invalid request coordinates.");
        return id;
    }

    what(x, y, z) {
        var id = this._toId(x, y, z);
        if ((id >= this._capacity) || (id < 0)) return 0;
        return this._blocks[id];
    }

    contains(x, y, z) {
        return this.what(x, y, z) !== 0;
    }

    getNeighbourChunkFromRelativeCoordinates(x, y, z) {
        let neighbourChunkI, neighbourChunkJ, neighbourChunkK;

        if (x < 0)
            neighbourChunkI = this._chunkI - 1;
        else if (x >= this._xSize)
            neighbourChunkI = this._chunkI + 1;
        else
            neighbourChunkI = this._chunkI;

        if (y < 0)
            neighbourChunkJ = this._chunkJ - 1;
        else if (y >= this._ySize)
            neighbourChunkJ = this._chunkJ + 1;
        else
            neighbourChunkJ = this._chunkJ;

        if (z < 0)
            neighbourChunkK = this._chunkK - 1;
        else if (z >= this._zSize)
            neighbourChunkK = this._chunkK + 1;
        else
            neighbourChunkK = this._chunkK;

        return this._worldModel.getChunk(neighbourChunkI, neighbourChunkJ, neighbourChunkK);
    }

    // Mustn't exceed negative [xyz] Size
    neighbourWhat(x, y, z) {
        let localX, localY, localZ;

        if (x < 0)
            localX = this._xSize + x;
        else if (x >= this._xSize)
            localX = x % this._xSize;
        else
            localX = x;

        if (y < 0)
            localY = this._ySize + y;
        else if (y >= this._ySize)
            localY = y % this._ySize;
        else
            localY = y;

        if (z < 0)
            localZ = this._zSize + z;
        else if (z >= this._zSize)
            localZ = z % this._zSize;
        else
            localZ = z;

        const nChunk = this.getNeighbourChunkFromRelativeCoordinates(x, y, z);
        return nChunk.what(localX, localY, localZ);
    }

    neighbourContains(x, y, z) {
        return this.neighbourWhat(x, y, z) !== 0;
    }

    add(x, y, z, blockId) {
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return;

        // Update blocks, surface blocks, then surface faces.
        this._blocks[id] = blockId;
        return id;
    }

    del(x, y, z) {
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return;

        // Update blocks, surface blocks, then surface faces.
        this._blocks[id] = 0;
        return id;
    }

    flushUpdates() {
        this._updates = [{}, {}, {}];
    }
}

export default Chunk;
