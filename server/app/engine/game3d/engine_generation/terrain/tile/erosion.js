
'use strict';

import { max }    from '../math';

import TimeUtils from '../../../../math/time';

const EROSION_STEPS = Object.freeze({
    WAITING: -1,

    ERODING: 3,
    FILLING_SINKS: 4,

    READY: 5,

    GETTING_FLUX: 0,
    GETTING_SLOPE: 1,
    COMPUTING_RATE: 2,
});

let Eroder = function(
    mesher
)
{
    if (!mesher) throw Error('Invalid argument');

    // this._indexBuffer = [];
    this.buffer = [];
    this.fluxBuffer = [];
    this.slopeBuffer = [];
    this.indexBuffer = [];
    this.downhillBuffer = [];

    this.mesher = mesher;

    // Progressive
    this.amount = 0;
    this.step = -1;
    this.erosionPass = 0; // current erosion iteration
    // this.fillSinksPass = 0; // current filling sinks iteration

    this.doneFillingSinks = false;
    this.isFillingSinks = false;

    this.cleanCoastPass = 0;
    this.cleanCoastPStep = 0;
    this.doAllAtOnce = false;
};

Eroder.prototype.setErosionAmount = function(amount)
{
    this.amount = amount;
};

Eroder.prototype.stepErosion = function(mesh, tile, n)
{
    const amount = this.amount;
    switch (this.step)
    {
        case EROSION_STEPS.WAITING:
            this.fillSinks(mesh, tile); // First sink fill
            if (this.doneFillingSinks)
                this.step = EROSION_STEPS.ERODING;
            break;

        case EROSION_STEPS.FILLING_SINKS:
            this.fillSinks(mesh, tile);
            if (this.doneFillingSinks) {
                this.erosionPass++;
                if (this.erosionPass >= n) this.step = EROSION_STEPS.READY;
                else this.step = EROSION_STEPS.ERODING;
            }
            break;

        case EROSION_STEPS.ERODING:
            this.erode(mesh, tile, amount);
            this.doneFillingSinks = false;
            this.isFillingSinks = false;
            this.step = EROSION_STEPS.FILLING_SINKS;
            break;

        case EROSION_STEPS.READY:
            this.doneFillingSinks = false;
            this.isFillingSinks = false;
            this.ready = true;
    }
};

Eroder.prototype.doErosion = function(mesh, tile, amount, n)
{
    n = n || 1;
    this.fillSinks(mesh, tile);
    for (let i = 0; i < n; i++) {
        this.erode(mesh, amount);
        this.fillSinks(mesh, tile);
    }
};

Eroder.prototype.resetDownhillBuffer = function(newBufferLength)
{
    if (this.downhillBuffer.length !== newBufferLength)
        this.downhillBuffer = new Int32Array(newBufferLength);
    else this.downhillBuffer.fill(0);
};

Eroder.prototype.resetSlopeBuffer = function(newBufferLength)
{
    if (this.slopeBuffer.length !== newBufferLength)
        this.slopeBuffer = new Float64Array(newBufferLength);
    else this.slopeBuffer.fill(0);
};

Eroder.prototype.resetFluxBuffer = function(newBufferLength)
{
    if (this.fluxBuffer.length !== newBufferLength)
        this.fluxBuffer = new Float64Array(newBufferLength);
    else this.fluxBuffer.fill(0);
};

Eroder.prototype.resetIndexBuffer = function(newBufferLength)
{
    if (this.indexBuffer.length !== newBufferLength)
        this.indexBuffer = new Float64Array(newBufferLength);
    else this.indexBuffer.fill(0);
};

Eroder.prototype.resetBuffer = function(newBufferLength)
{
    if (this.buffer.length !== newBufferLength)
        this.buffer = new Float64Array(newBufferLength);
    else this.buffer.fill(0);
};

Eroder.prototype.swapBuffers = function(otherObject)
{
    let tempBuffer = this.buffer;
    this.buffer = otherObject.buffer;
    otherObject.buffer = tempBuffer;
};

Eroder.prototype.downhill = function(mesh, tile)
{
    let nbTris = tile.buffer.length;
    this.resetDownhillBuffer(nbTris);
    let downs = this.downhillBuffer;
    for (let i = 0; i < nbTris; i++) {
        downs[i] = this.downfrom(mesh, tile, i);
    }
    return downs;
};

Eroder.prototype.downfrom = function(mesh, tile, i)
{
    const mesher = this.mesher;

    if (mesher.isedge(mesh, i)) return -2;
    let h = tile.buffer;
    let best = -1;
    let besth = h[i];
    let nbs = mesher.neighbours(mesh, i);
    for (let j = 0, l = nbs.length; j < l; j++)
    {
        const b = nbs[j];
        const hb = h[b];
        if (hb < besth) {
            besth = hb;
            best = b;
        }
    }
    return best;
};

Eroder.prototype.topologicalFill = function(mesh, tile)
{
    const mesher = this.mesher;
    let h = tile.buffer;
    const hl = h.length;

    let swiper = [];
    for (let i = 0; i < hl; ++i) {
        let nbs = mesher.neighbours(mesh, i);
        const nbl = nbs.length;
        if (nbl < 3) {
            continue;
        }
        const hi = h[i];
        if (h[nbs[0]] > hi && h[nbs[1]] > hi && h[nbs[2]] > hi)
        {
            swiper.push(i);
        }
    }

    let eps = 1e-5;
    while (swiper.length)
    {
        const i = swiper.pop();
        let nbs = mesher.neighbours(mesh, i);
        const j0 = nbs[0]; const hj0 = h[j0];
        const j1 = nbs[1]; const hj1 = h[j1];
        const j2 = nbs[2]; const hj2 = h[j2];

        let min; // let minJ;
        if (hj0 <= hj1 && hj0 <= hj2) {
            min = hj0; // minJ = j0;
        } else if (hj1 <= hj0 && hj1 <= hj2) {
            min = hj1; // minJ = j1;
        } else {
            min = hj2; // minJ = j2;
        }
        h[i] = min + eps;
        // eps += 1e-9; // for fast approximate erosion
        let nbs2 = mesher.neighbours(mesh, j0);
        if (nbs2.length === 3 && h[nbs2[0]] > hj0 && h[nbs2[1]] > hj0 && h[nbs2[2]] > hj0) swiper.push(j0);
        nbs2 = mesher.neighbours(mesh, j1);
        if (nbs2.length === 3 && h[nbs2[0]] > hj1 && h[nbs2[1]] > hj1 && h[nbs2[2]] > hj1) swiper.push(j1);
        nbs2 = mesher.neighbours(mesh, j2);
        if (nbs2.length === 3 && h[nbs2[0]] > hj2 && h[nbs2[1]] > hj2 && h[nbs2[2]] > hj2) swiper.push(j2);
    }
};

Eroder.prototype.fillSinks = function(mesh, tile, epsilon)
{
    const mesher = this.mesher;

    let h = tile.buffer;
    epsilon = epsilon || 1e-5;
    // let infinity = 999999;

    const hl = h.length;
    let newh;
    if (!this.isFillingSinks) {
        this.resetBuffer(hl);
        newh = this.buffer;
        for (let i = 0; i < hl; ++i)
        {
            if (mesher.isnearedge(mesh, i)) {
                newh[i] = h[i];
            } else {
                newh[i] = Infinity;
            }
        }
        this.isFillingSinks = true;
    }
    newh = this.buffer;

    // Reduce iteration number (not worth it)
    // let hh = this._indexBuffer;
    // if (hh.length < hl) {
    //     this._indexBuffer = new Float64Array(hl);
    //     hh = this._indexBuffer;
    // }
    // for (let i = 0; i < hl; ++i)
    //     hh[i] = Math.floor((1 + h[i]) * 10000000000) * 100000 + i;
    // hh.sort();
    // for (let i = 0; i < hl; ++i) hh[i] %= 100000;

    const performQueue = this.doAllAtOnce;
    if (performQueue)
    {
        // const ts1 = window.performance.now();
        this.topologicalFill(mesh, tile);
        // const ts2 = window.performance.now();
        // console.log(`BFS: ${Math.floor((ts2 - ts1) * 1000)} ns.`);
        return;
    }

    const start = TimeUtils.getTimeSecMillis();
    let changed = false;
    let oh;
    // let iterations = 0;
    while (true)
    {
        // ++iterations;
        changed = false;
        for (let ii = 0; ii < hl; ++ii)
        {
            const i = ii;
            const hi = h[i];
            if (newh[i] === hi) continue;
            let nbs = mesher.neighbours(mesh, i);
            const nbl = nbs.length;
            for (let j = 0; j < nbl; j++)
            {
                oh = newh[nbs[j]] + epsilon;
                if (hi >= oh) {
                    newh[i] = hi;
                    changed = true;
                    break;
                }
                else if (newh[i] > oh)
                {
                    newh[i] = oh;
                    changed = true;
                }
            }
        }

        if (!changed)
        {
            // console.log(iterations);
            this.doneFillingSinks = true;
            this.isFillingSinks = false;
            this.swapBuffers(tile);
            return;
        }
        else
        {
            const current = TimeUtils.getTimeSecMillis();
            const delta = current - start;
            if (delta > 5) return;
            // console.log(delta);
        }
    }
};

Eroder.prototype.getFlux = function(mesh, tile)
{
    let dh = this.downhill(mesh, tile);
    let nbTris = tile.buffer.length;
    this.resetIndexBuffer(nbTris);
    this.resetFluxBuffer(nbTris);
    let idxs = this.indexBuffer;
    let flux = this.fluxBuffer;
    let h = tile.buffer;

    const hl = h.length;
    const hlInv = 1 / hl;
    for (let i = 0; i < hl; ++i) {
        // idxs[i] = i;
        idxs[i] = Math.floor((1 + h[i]) * 10000000000) * 100000 + i;
        flux[i] = hlInv;
    }
    idxs.sort();
    for (let i = 0; i < hl; ++i)
        idxs[i] %= 100000;
    // idxs.sort((a, b) => {
    //     return h[b] - h[a];
    // });

    for (let i = 0; i < hl; i++) {
        // const j = idxs[i];
        const j = idxs[hl - 1 - i];
        const dhj = dh[j];
        if (dhj >= 0) {
            flux[dhj] += flux[j];
        }
    }

    return flux;
};

Eroder.prototype.trislope = function(mesh, tile, i)
{
    let nbs = this.mesher.neighbours(mesh, i);
    if (nbs.length !== 3) return [0, 0];
    const p0 = mesh.vxs[nbs[0]];
    const p1 = mesh.vxs[nbs[1]];
    const p2 = mesh.vxs[nbs[2]];

    const x1 = p1[0] - p0[0];
    const x2 = p2[0] - p0[0];
    const y1 = p1[1] - p0[1];
    const y2 = p2[1] - p0[1];

    const det = x1 * y2 - x2 * y1;
    let h = tile.buffer;
    const h1 = h[nbs[1]] - h[nbs[0]];
    const h2 = h[nbs[2]] - h[nbs[0]];

    return [
        (y2 * h1 - y1 * h2) / det,
        (-x2 * h1 + x1 * h2) / det
    ];
};

Eroder.prototype.getSlope = function(mesh, tile)
{
    // let dh = downhill(h);
    // let slope = zero(h.mesh);
    this.resetSlopeBuffer(tile.buffer.length);
    let slope = this.slopeBuffer;
    let h = tile.buffer;
    for (let i = 0; i < h.length; i++)
    {
        let s = this.trislope(mesh, tile, i);
        slope[i] = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
        // continue;
        // if (dh[i] < 0) {
        //     slope[i] = 0;
        // } else {
        //     slope[i] = (h[i] - h[dh[i]]) / distance(h.mesh, i, dh[i]);
        // }
    }

    return slope;
};

Eroder.prototype.erosionRate = function(mesh, tile)
{
    let flux = this.getFlux(mesh, tile); // flux buffer
    let slope = this.getSlope(mesh, tile); // slope buffer
    let nbTris = tile.buffer.length;
    this.resetBuffer(nbTris); // this.buffer
    let newh = this.buffer;
    for (let i = 0; i < nbTris; i++)
    {
        let river = Math.sqrt(flux[i]) * slope[i];
        let creep = slope[i] * slope[i];
        let total = 1000 * river + creep;
        total = total > 200 ? 200 : total;
        newh[i] = total;
    }
    return newh;
};

Eroder.prototype.erode = function(mesh, tile, amount)
{
    let h = tile.buffer;
    let er = this.erosionRate(mesh, tile); // this.buffer
    let maxr = max(er);
    let c = amount / maxr;

    const hl = h.length;
    for (let i = 0; i < hl; i++)
    {
        h[i] = h[i] - c * er[i];
    }
};

Eroder.prototype.cleanCoastP1 = function(mesh, tile)
{
    const mesher = this.mesher;
    let h = tile.buffer;
    let nbTris = h.length;
    let newh;

    this.resetBuffer(nbTris);
    newh = this.buffer;
    h = tile.buffer;
    for (let i = 0; i < h.length; i++) {
        newh[i] = h[i];
        let nbs = mesher.neighbours(mesh, i);
        if (h[i] <= 0 || nbs.length !== 3) continue;
        let count = 0;
        let best = -999999;
        for (let j = 0; j < nbs.length; j++) {
            const hnbsj = h[nbs[j]];
            if (hnbsj > 0) {
                count++;
            } else if (hnbsj > best) {
                best = hnbsj;
            }
        }
        if (count > 1) continue;
        newh[i] = best / 2;
    }
    this.swapBuffers(tile);
};

Eroder.prototype.cleanCoastP2 = function(mesh, tile)
{
    const mesher = this.mesher;
    let h = tile.buffer;
    let nbTris = h.length;
    let newh;

    this.resetBuffer(nbTris);
    newh = this.buffer;
    h = tile.buffer;
    for (let i = 0; i < h.length; i++) {
        newh[i] = h[i];
        let nbs = mesher.neighbours(mesh, i);
        if (h[i] > 0 || nbs.length !== 3) continue;
        let count = 0;
        let best = 999999;
        for (let j = 0; j < nbs.length; j++) {
            const hnbsj = h[nbs[j]];
            if (hnbsj <= 0) {
                count++;
            } else if (hnbsj < best) {
                best = hnbsj;
            }
        }
        if (count > 1) continue;
        newh[i] = best / 2;
    }
    this.swapBuffers(tile);
};

Eroder.prototype.cleanCoast = function(mesh, tile)
{
    if (this.cleanCoastPStep === 0)
    {
        const start = TimeUtils.getTimeSecMillis();
        this.cleanCoastP1(mesh, tile);
        const current = TimeUtils.getTimeSecMillis();
        const delta = current - start;

        if (delta < 3) {
            this.cleanCoastP2(mesh, tile);
            this.cleanCoastPass++;
        } else {
            this.cleanCoastPStep = 1;
        }
    }
    else if (this.cleanCoastPStep === 1)
    {
        this.cleanCoastP2(mesh, tile);
        this.cleanCoastPStep = 0;
    }
};

export {
    Eroder
};
