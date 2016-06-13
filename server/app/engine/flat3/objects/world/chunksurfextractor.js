/**
 *
 */

'use strict';

class ChunkSurfaceExtractor {
    constructor(chunk) {
        this._chunk = chunk;
    }

    extractSurfaceBlocks() {
        let chunk = this._chunk;
        const iS = chunk.dimensions[0];
        const ijS = chunk.dimensions[0] * chunk.dimensions[1];

        var sbs = chunk.surfaceBlocks;
        function addSurfaceBlock(bid) {
            const ijC = bid % ijS;
            const z = (bid - ijC) / ijS;
            if (sbs.hasOwnProperty(z)) {
                sbs[z].push((ijC));
            } else {
                sbs[z] = [ijC];
            }
        }

        // Test neighbourhood.
        let bs = chunk.blocks;
        let length = bs.length;
        for (let b = 0; b < length; ++b) {
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
                if (kP < length && bs[kP] === 0) {addSurfaceBlock(b); continue;}
                const kM = b-ijS;
                if (kM >= 0 && bs[kM] === 0) {addSurfaceBlock(b);}
            }
        }
    }

    extractConnectedComponents() {
        let chunk = this._chunk;

        var connectedComponents = new Uint8Array(chunk.capacity);
        connectedComponents.fill(0);

        var sbs = chunk.surfaceBlocks;
        var bs = chunk.blocks;
        const iS = chunk.dimensions[0];
        const ijS = chunk.dimensions[0] * chunk.dimensions[1];

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
        // TODO check if isNot()
        function free(d, cc, b) {
            let bm = 0;
            switch (d) {
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

        // Test diagonal neighbours for linkage.
        function arc(d, cc, b) {
            let bm = 0;
            switch (d) {
                case 0: bm = b-1; // iM
                    return (!is(0, cc, b));
                case 1: bm = b-iS; // jM
                    return (!is(1, cc, b));
                case 2: bm = b-ijS; // kM
                    return (!is(2, cc, b));
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
                // TODO extract triple faces.
                connectedComponents[lex] = ccid++;
            }
        }

        // PreMerge.
        // TODO adapt for faces triple array.
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

        chunk.fastComponents = fastCC;
        chunk.connectedComponents = connectedComponents;
    }
}

export default ChunkSurfaceExtractor;
