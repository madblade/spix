/**
 *
 */

'use strict';

class Chunk {

    constructor(xSize, ySize, zSize, chunkId) {
        // Dimensions.
        this._xSize = xSize;
        this._ySize = ySize;
        this._zSize = zSize;
        this._capacity = this._xSize * this._ySize * this._zSize;
        this._chunkId = chunkId;

        // Blocks. x, then y, then z.
        this._blocks = new Uint8Array(this._capacity); // '';
        this._surfaceBlocks = {};
        this._connectedComponents = [];

        // Events.
        this._lastUpdated = process.hrtime();

        this.fillChunk(48, 1);
        this.computeSurfaceBlocksFromScratch();
        this.computeConnectedComponents();
        console.log(this._surfaceBlocks);
    }

    get blocks() { return this._blocks; }
    get chunkId() { return this._chunkId; }

    computeSurfaceBlocksFromScratch() {
        console.log('Extracting surface...');
        const ijS = this._xSize * this._ySize;
        const iS = this._xSize;

        var scope = this;
        function addSurfaceBlock(bid) {
            const ijC = bid % ijS;
            const z = (bid - ijC) / ijS;
            var sb = scope._surfaceBlocks;
            if (sb.hasOwnProperty(z)) {
                sb[z].push((ijC));
            } else {
                sb[z] = [ijC];
            }
        }

        // Test neighbourhood.
        let bs = this._blocks;
        for (let b = 0; b < bs.length; ++b) {
            if (bs[b] !== 0) {
                const iP = b+1;
                if ((iP % iS !== 0) && (bs[iP] === 0)) {addSurfaceBlock(b); continue;}
                const iM = b-1;
                if ((iM % iS !== iS-1) && (bs[iM] === 0)) {addSurfaceBlock(b); continue;}

                const jP = b+iS;
                if ((jP % ijS !== 0) && (bs[jP] === 0)) {addSurfaceBlock(b); continue;}
                const jM = b-iS;
                if ((jM % ijS !== ijS-1) && (bs[jM] === 0)) {addSurfaceBlock(b); continue;}

                const kP = b+ijS;
                if (kP < bs.length && bs[kP] === 0) {addSurfaceBlock(b); continue;}
                const kM = b-ijS;
                if (kM >= 0 && bs[kM] === 0) {addSurfaceBlock(b);}
            }
        }
        // TODO optimize during generation.
    }

    computeConnectedComponents() {
        var connectedComponents = new Uint8Array(this._capacity);
        connectedComponents.fill(0);
        var sbs = this._surfaceBlocks;
        var bs = this._blocks;

        // Compute borders.
        let ccid = 1;
        for (let z in sbs) {
            if (!sbs.hasOwnProperty(z)) continue;
            let layer = sbs[z];
            for (let b = 0; b < layer.length; ++b) {
                connectedComponents[layer[b]] = ccid++;
            }
        }

        // Merge borders.
        for (let z in sbs) {
            // TODO merge.
        }

        this._connectedComponents = connectedComponents;
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
        var id = x + y * this._xSize + z * this._ySize;
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
