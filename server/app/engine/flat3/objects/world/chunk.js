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
        this._blocks = new Uint8Array(); // '';
        this._surfaceBlocks = {};
        this._connectedComponents = new Uint8Array();
        this._fastConnectedComponents = {};

        // Events.
        this._lastUpdated = process.hrtime();

        this.fillChunk(48, 1);
        this.computeSurfaceBlocksFromScratch();
        this.computeConnectedComponents();
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
                if (((jP-b%iS) % ijS !== 0) && (bs[jP] === 0)) {addSurfaceBlock(b); continue;}
                const jM = b-iS;
                if (((jM-b%iS) % ijS !== ijS-1) && (bs[jM] === 0)) {addSurfaceBlock(b); continue;}

                const kP = b+ijS;
                if (kP < bs.length && bs[kP] === 0) {addSurfaceBlock(b); continue;}
                const kM = b-ijS;
                if (kM >= 0 && bs[kM] === 0) {addSurfaceBlock(b);}
            }
        }
        // TODO optimize during generation.
    }

    computeConnectedComponents() {
        console.log("Computing connected components...");
        var connectedComponents = new Uint8Array(this._capacity);
        connectedComponents.fill(0);

        var sbs = this._surfaceBlocks;
        var bs = this._blocks;
        const ijS = this._xSize * this._ySize;
        const iS = this._xSize;

        // Tests neighbours for existence.
        function is(d, cc, b) {
            switch(d) {
                case 0: return (((b-1) % iS !== iS-1) && (cc[b-1] !== 0)); // iM
                case 1: return (((b-iS-(b%iS)) % ijS !== ijS-1) && (cc[(b-iS)] !== 0)); // jM
                case 2: return ((b-ijS) >= 0 && bs[b-ijS] === 0); // kM

                case 3: return (((b+1) % iS !== 0) && (bs[b+1] === 0)); // iP
                case 4: return (((b+iS-(b%iS)) % ijS !== 0) && (bs[b+iS] === 0)); // jP
                case 5: return (b+ijS < bs.length && bs[b+ijS] === 0); // kP
                default: return false;
            }
        }

        // Tests diagonal neighbours for non-existence.
        function free(d, cc, b) {
            let bm = 0;
            switch(d) {
                case 0: bm = b-1; // iM
                    return (is(0, cc, b) && (
                        (!is(1, cc, bm) && !is(1, cc, b)) || (!is(4, cc, bm) && !is(4, cc, b)) || // j
                        (!is(2, cc, bm) && !is(2, cc, b)) || (!is(5, cc, bm) && !is(5, cc, b)) // k
                    ));
                case 1: bm = b-iS; // jM
                    return (is(1, cc, b) && (
                        (!is(0, cc, bm) && !is(0, cc, b)) || (!is(3, cc, bm) && !is(3, cc, b)) || // i
                        (!is(2, cc, bm) && !is(2, cc, b)) || (!is(5, cc, bm) && !is(5, cc, b)) // k
                    ));
                case 2: bm = b-ijS; // kM
                    return (is(2, cc, b) && (
                        ( !is(0, cc, bm) && !is(0, cc, b)) || ( !is(3, cc, bm) && !is(3, cc, b)) || // i
                        ( !is(1, cc, bm) && !is(1, cc, b)) || ( !is(4, cc, bm) && !is(4, cc, b)) // j
                    ));
                default: return false;
            }
        }

        // Compute borders.
        let ccid = 1;
        for (let z in sbs) {
            if (!sbs.hasOwnProperty(z)) continue;
            let layer = sbs[z];
            for (let b = 0; b < layer.length; ++b) {
                let lex = layer[b] + z*ijS;
                connectedComponents[lex] = ccid++;
            }
        }

        // PreMerge.
        var merger = [];
        for (let z in sbs) {
            if (!sbs.hasOwnProperty(z)) continue;
            let cc = connectedComponents;
            let layer = sbs[z];
            for (let b = 0; b < layer.length; ++b) {
                const lex = layer[b] + z * ijS;
                let k = false, j = false;
                if (free(2, cc, lex)) {
                    cc[lex] = cc[lex - ijS];
                    k = true;
                }
                if (free(1, cc, lex)) {
                    if (k && cc[lex] !== cc[lex - iS]) merger.push([cc[lex], cc[lex - iS]]);
                    else cc[lex] = cc[lex - iS];
                    j = true;
                }
                if (free(0, cc, lex)) {
                    if ((j || k) && (cc[lex] !== cc[lex - 1])) merger.push(cc[lex], cc[lex - 1]);
                    else cc[lex] = cc[lex - 1];
                }
            }
        }

        // Fast access.
        var fastCC = {};
        for (let i = 0; i < connectedComponents.length; ++i) {
            if (connectedComponents[i] === 0) continue;
            if (!fastCC.hasOwnProperty(connectedComponents[i]))
                fastCC[connectedComponents[i]] = [i];
            else fastCC[connectedComponents[i]].push(i);
        }

        // TODO debug.
        // PostMerge.
        var fastMerger = {};
        for (let c = 0; c<merger.length; ++c) {
            let min = Math.min(merger[c][0], merger[c][1]);
            let max = Math.max(merger[c][0], merger[c][1]);
            if (!fastMerger.hasOwnProperty(max)) fastMerger[max] = min;
            else if (min < fastMerger[max]) fastMerger[max] = min;
        }
        for (let id in fastCC) {
            if (!fastCC.hasOwnProperty(id)) continue;
            let cc = fastCC[id];
            if (fastMerger.hasOwnProperty(id)) {
                let minCC = fastMerger[id];
                // Merge: update connected components
                for (let i = 0; i<cc.length; ++i) {
                    connectedComponents[cc[i]] = minCC;
                }
                // Merge: update fast components
                fastCC[minCC] = fastCC[minCC].concat(fastCC[id]);
                delete fastCC[id];
            }
        }

        this._fastConnectedComponents = fastCC;
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
