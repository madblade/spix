/**
 *
 */

'use strict';

import BlockExtractor from './extraction/chunkblockx';
import FaceExtractor from './extraction/chunkfacex';

import ChunkLoader from './loading/chunkloader';

import BlockUpdater from './update/blockupdater';
import FaceUpdater from './update/faceupdater';

class Chunk {

    constructor(xSize, ySize, zSize, chunkId, worldManager) {
        // App.
        this._worldManager = worldManager;

        // Dimensions, coordinates
        this._xSize = xSize;
        this._ySize = ySize;
        this._zSize = zSize;

        this._capacity = this._xSize * this._ySize * this._zSize;
        this._chunkId = chunkId;
        let ij = chunkId.split(',');

        this._chunkI = parseInt(ij[0]);
        this._chunkJ = parseInt(ij[1]);
        this._chunkK = 0;

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
        this.preloadNeighborChunks();
        this.computeSurfaceBlocksFromScratch();
        this.computeConnectedComponents();
        this._ready = true;
        console.log("Chunk " + this._chunkId + " ready.");
    }

    // Getters
    get chunkI() { return this._chunkI; }
    get chunkJ() { return this._chunkJ; }
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
    get manager() { return this._worldManager; }

    // Setters
    set blocks(newBlocks) { this._blocks = newBlocks; }
    set surfaceBlocks(newSurfaceBlocks) { this._surfaceBlocks = newSurfaceBlocks; }
    set fastComponents(newFastComponents) { this._fastConnectedComponents = newFastComponents; }
    set fastComponentsIds(newFastComponentsIds) { this._fastConnectedComponentsIds = newFastComponentsIds; }
    set connectedComponents(newConnectedComponents) { this._connectedComponents = newConnectedComponents; }
    set updates(newUpdates) { this._updates = newUpdates; }

    /**
     * Preload neighbors.
     */
    preloadNeighborChunks() {
        console.log('\tPreloading neighbor chunks...');
        ChunkLoader.preLoadNeighborChunks(this, this._worldManager);
    }

    /**
     * Detect boundary blocks.
     */
    computeSurfaceBlocksFromScratch() {
        console.log('\tExtracting surface...');
        try {
            BlockExtractor.extractSurfaceBlocks(this);
        } catch(err) {
            console.log(err.message);
        }
    }

    /**
     * Detect connected boundary face components.
     */
    computeConnectedComponents() {
        console.log("\tComputing connected components...");
        try {
            FaceExtractor.extractConnectedComponents(this);
        } catch(err) {
            console.log(err.message);
        }
    }

    setDirtyFlag() {
        this._worldManager.chunkUpdated(this._chunkId);
    }

    // Set all cubes until a given height to a given id.
    fillChunk(toZ, blockId) {
        if (typeof toZ !== "number") return;
        if (typeof blockId !== "number") return;
        console.log('Generating chunk ' + this._chunkId + ' to ' + toZ + '...');

        const numberOfBlocksToFill = this._xSize * this._ySize * toZ;
        const numberOfBlocks = this._capacity;

        let blocks = new Uint8Array(numberOfBlocks);
        blocks.fill(blockId, 0, numberOfBlocksToFill);
        blocks.fill(0, numberOfBlocksToFill, numberOfBlocks);

        //blocks[3122] = 1;
        //blocks[3186] = 1;

        /*
        let numberAdded = 0;
        for (let i = numberOfBlocksToFill; i<numberOfBlocksToFill+this._xSize*this._ySize; ++i) {
            if (Math.random() > 0.5) {
                blocks[i] = blockId;
                numberAdded++;
            }
        }
        console.log(numberAdded + " different block(s) added.");
        */

        this._blocks = blocks;

        console.log("\t" + this._blocks.length + " blocks generated.");
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
        let neighbourChunkI, neighbourChunkJ, neighbourChunkZ;

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

        // TODO zeefy
        if (z < 0)
            neighbourChunkZ = this._chunkK - 1;
        else if (z >= this._zSize)
            neighbourChunkZ = this._chunkK + 1;
        else
            neighbourChunkZ = this._chunkK;

        return this._worldManager.getChunk(neighbourChunkI, neighbourChunkJ);
    }

    /**
     * Mustn't exceed negative [xyz]Size
     * @param x
     * @param y
     * @param z
     */
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
        BlockUpdater.updateSurfaceBlocksAfterAddition(this, id, x, y, z);
        FaceUpdater.updateSurfaceFacesAfterAddition(this, id, x, y, z);
    }

    del(x, y, z) {
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return;

        // Update blocks, surface blocks, then surface faces.
        this._blocks[id] = 0;
        BlockUpdater.updateSurfaceBlocksAfterDeletion(this, id, x, y, z);
        FaceUpdater.updateSurfaceFacesAfterDeletion(this, id, x, y, z);
    }

    flushUpdates() {
        this._updates = [{}, {}, {}];
    }
}

export default Chunk;
