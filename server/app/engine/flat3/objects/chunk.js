/**
 *
 */

'use strict';

class Chunk {

    constructor() {
        // Dimensions.
        this._xSize = 8;
        this._ySize = 8;
        this._zSize = 256;
        this._capacity = this._xSize * this._ySize * this._zSize;

        // Blocks. x, then y, then z.
        this._blocks = new Uint8Array(this._capacity); // '';
        this._surfaceBlocks = [new Uint8Array(), new Uint8Array(), new Uint8Array()];
        this._connectedComponents = [];

        // Events.
        //this._lastUpdated = process.hrtime();

        this.fillChunk(48, 1);
        this.computeSurfaceBlocks();
        this.computeConnectedComponents();
    }

    get blocks() { return this._blocks; }

    computeSurfaceBlocks() {
        // TODO optimize during generation.
    }

    computeConnectedComponents() {
        // TODO extract components from surface blocks and push them into connected components.
    }

    // Set all cubes until a given height to a given id.
    fillChunk(toZ, blockId) {
        if (typeof toZ !== "number") return;
        if (typeof blockId !== "string" || blockId.length !== 1) return;

        const numberOfBlocksToFill = this._xSize * this._ySize * toZ;
        const numberOfBlocks = this._capacity;

        for (let i = 0; i < numberOfBlocksToFill; ++i) blocks[i] = blockId;
        for (let i = numberOfBlocksToFill; i < numberOfBlocks; ++i) blocks[i] = 0;

        this._blocks = blocks;
    }

    _toId(x, y, z) {
        var id = x + y * this._xSize + z * this._ySize;
        if (id >= this._capacity) console.log("WARN: invalid request coordinates.");
        return id;
    }

    what(x, y, z) {
        var id = this._toId(x, y, z);
        if (id >= this._capacity) return '0';

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

        this._blocks[id] = '0';
    }
}

export default Chunk;
