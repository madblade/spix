/**
 *
 */

'use strict';

import ChunkSurfaceExtractor from './chunksurfextractor';

class Chunk {

    constructor(xSize, ySize, zSize, chunkId) {
        // Dimensions.
        this._xSize = xSize;
        this._ySize = ySize;
        this._zSize = zSize;
        this._capacity = this._xSize * this._ySize * this._zSize;
        this._chunkId = chunkId;

        // Blocks. x, then y, then z.
        this._blocks = new Uint8Array(); // '';
        this._surfaceBlocks = {};
        this._connectedComponents = new Uint8Array();
        this._fastConnectedComponents = {};

        // Events.
        this._lastUpdated = process.hrtime();

        this.fillChunk(48, 1);
        this.computeSurfaceBlocksFromScratch();
        this.computeConnectedComponents();

        console.log("Computed.");
        //console.log(this._fastConnectedComponents);
    }

    // Getters
    get chunkId() { return this._chunkId; }
    get dimensions() { return [this._xSize, this._ySize, this._zSize]; }
    get capacity() { return this._capacity; }
    get blocks() { return this._blocks; }
    get surfaceBlocks() { return this._surfaceBlocks; }
    get fastComponents() { return this._fastConnectedComponents; }
    get connectedComponents() { return this._connectedComponents; }

    // Setters
    set blocks(newBlocks) { this._blocks = newBlocks; }
    set surfaceBlocks(newSurfaceBlocks) { this._surfaceBlocks = newSurfaceBlocks; }
    set fastComponents(newFastComponents) { this._fastConnectedComponents = newFastComponents; }
    set connectedComponents(newConnectedComponents) { this._connectedComponents = newConnectedComponents; }

    /**
     * Detect boundary blocks.
     */
    computeSurfaceBlocksFromScratch() {
        console.log('Extracting surface...');
        var extractor = new ChunkSurfaceExtractor(this);
        extractor.extractSurfaceBlocks();
        // TODO optimize during generation.
    }

    /**
     * Detect connected boundary face components.
     */
    computeConnectedComponents() {
        console.log("Computing connected components...");
        var extractor = new ChunkSurfaceExtractor(this);
        extractor.extractConnectedComponents();
    }

    // Set all cubes until a given height to a given id.
    fillChunk(toZ, blockId) {
        if (typeof toZ !== "number") return;
        if (typeof blockId !== "number") return;
        console.log('Generating chunk...');

        const numberOfBlocksToFill = this._xSize * this._ySize * toZ;
        const numberOfBlocks = this._capacity;

        let blocks = new Uint8Array(numberOfBlocks);
        blocks.fill(blockId, 0, numberOfBlocksToFill);
        blocks.fill(0, numberOfBlocksToFill, numberOfBlocks);
        this._blocks = blocks;

        console.log("\t" + this._blocks.length + " blocks generated.");
    }

    _toId(x, y, z) {
        var id = x + y * this._xSize + z * this._xSize * this._ySize;
        if (id >= this._capacity) console.log("WARN: invalid request coordinates.");
        return id;
    }

    what(x, y, z) {
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return 0;
        return this._blocks[id];
    }

    add(x, y, z, blockId) {
        if (typeof blockId !== "string" || blockId.length !== 1) return;
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return;
        this._blocks[id] = blockId;
    }

    del(x, y, z) {
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return;

        this._blocks[id] = 0;
    }
}

export default Chunk;
