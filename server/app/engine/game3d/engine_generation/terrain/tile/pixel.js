
'use strict';

import { Random }              from './random';
import { TileablePerlinNoise } from './noise';

import TimeUtils from '../../../../math/time';

const CHUNK_TREES = Object.freeze({
    NO_TREES: 0,
    LIGHT: 1,
    DENSE: 2,
    FULL: 3
});

let Rasterizer = function(dimension)
{
    this.dimension = dimension || 512;
    this.chunkHeight = 16;
    this.chunkWidth = 16;

    this.heightBuffer = [];
    this.surfaceBuffer = [];

    this.treeDensities = [];
    // this.chunkBiomes = [];
    this.rng2 = null;

    this.noiseTile = [];
    this.noiseTileDimension = 256;
    this.noiseTileReady = false;

    this.rng = new Random('simplex');
    this.tpng = new TileablePerlinNoise(this.rng);

    this.zBuffer = [];
    this.zPassBuffer = [];

    // Progressive
    this.step = -1;
    this.currentTriangle = 0; // current rasterized triangle
    this.heightPassDone = false;
};

Rasterizer.prototype.setNoiseTile = function(noiseTile)
{
    const td = this.noiseTileDimension;
    if (noiseTile.length !== td * td)
    {
        throw Error('[Rasterizer] Noise tile dimension mismatch.');
    }
    if (!(noiseTile instanceof Float32Array))
    {
        throw Error('[Rasterizer] Noise tile type mismatch.');
    }

    this.noiseTile = noiseTile;
    this.noiseTileReady = true;
};

Rasterizer.prototype.resetBuffers = function(size)
{
    if (this.zBuffer.length !== size) this.zBuffer = new Float64Array(size);
    else this.zBuffer.fill(0);
    if (this.zPassBuffer.length !== size) this.zPassBuffer = new Uint8Array(size);
    else this.zPassBuffer.fill(0);
};

Rasterizer.prototype.computeTriMesh = function(
    mesh, tile
)
{
    // let pts = mesh.pts;
    let tris = mesh.tris;
    let tidx = mesh.triPointIndexes;
    let values = tile.buffer;
    let nbInteriorTris = mesh.nbInteriorTris;

    let triMesh = [];
    this.resetBuffers(mesh.nbTriPointIndexes); // Prevent GC
    let z = this.zBuffer; // new Float64Array(mesh.nbTriPointIndexes);
    let zPass = this.zPassBuffer; // new Uint8Array(mesh.nbTriPointIndexes);

    // Compute point heights
    for (let i = 0; i < tris.length; ++i)
    {
        let t = tris[i];
        // let v = i >= nbInteriorTris ? -0.01 : values[i];
        let v = values[i];
        if (i >= nbInteriorTris)
        {
            // console.log(values[i]);
        }
        if (t.length !== 3) continue;
        const ti = tidx[i];
        for (let j = 0; j < 3; ++j) {
            const index = ti[j];
            // let p = t[j];
            if (!z[index])
            {
                z[index] = v;
                zPass[index] = 1;
            } else {
                let ov = z[index];
                if (Math.sign(v) !== Math.sign(ov)) {
                    z[index] = Math.min(ov, v);
                    zPass[index] = 1;
                } else {
                    z[index] = ov + v;
                    zPass[index] += 1;
                }
            }
            z[index] += v;
            zPass[index]++;
        }
    }

    // for (let i = 0; i < z.length; ++i)
    // {
    //     let count = zPass[i];
    //     if (count < 1) continue;
    //     z[i] /= count;
    // }

    // Compute 3D tris
    for (let i = 0; i < tris.length; ++i)
    {
        let t = tris[i];
        if (t.length !== 3) continue;
        const ti = tidx[i];
        let newTri = [];
        // let v = values[i];
        for (let j = 0; j < 3; ++j)
        {
            let p = t[j];
            let x = p[0]; let y = p[1];
            // let index = `${x.toFixed(5)},${y.toFixed(5)}`;
            const index = ti[j];
            let height = z[index] / zPass[index];
            newTri.push([x, y, height]);
        }
        triMesh.push(newTri);
    }

    return triMesh;
};

Rasterizer.prototype.putPixel = function(x, y, v)
{
    let buffer = this.surfaceBuffer;
    const w = this.dimension;
    buffer[y * w + x] = v;
};

// https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
// Algorithm from Eric Andres, “Discrete circles, rings and spheres”
Rasterizer.prototype.drawCircle = function(centerX, centerY, radius)
{
    let x; let y; let d;
    x = 0; y = radius; d = radius - 1;

    const v = 2;
    while (y >= x)
    {
        this.putPixel(centerX + x, centerY + y, v);
        this.putPixel(centerX + y, centerY + x, v);
        this.putPixel(centerX - x, centerY + y, v);
        this.putPixel(centerX - y, centerY + x, v);

        this.putPixel(centerX + x, centerY - y, v);
        this.putPixel(centerX + y, centerY - x, v);
        this.putPixel(centerX - x, centerY - y, v);
        this.putPixel(centerX - y, centerY - x, v);

        if (d >= 2 * x)
        {
            d -= 2 * x + 1;
            ++x;
        }
        else if (d < 2 * (radius - y))
        {
            d += 2 * y - 1;
            --y;
        }
        else
        {
            d += 2 * (y - x - 1);
            --y;
            ++x;
        }
    }
};

// from https://github.com/delphifirst/js-rasterizer
// 2016 Yang Cao
Rasterizer.prototype.drawTriangle = function(
    v1h0, v1h1, v1h2,
    v2h0, v2h1, v2h2,
    v3h0, v3h1, v3h2
)
{
    const minX = Math.min(v1h0, v2h0, v3h0);
    const maxX = Math.max(v1h0, v2h0, v3h0);
    const minY = Math.min(v1h1, v2h1, v3h1);
    const maxY = Math.max(v1h1, v2h1, v3h1);

    const dx12 = v1h1 - v2h1;
    const dy12 = v2h0 - v1h0;
    const dz12 = v1h0 * v2h1 - v2h0 * v1h1;

    const dx23 = v2h1 - v3h1;
    const dy23 = v3h0 - v2h0;
    const dz23 = v2h0 * v3h1 - v3h0 * v2h1;

    const dx31 = v3h1 - v1h1;
    const dy31 = v1h0 - v3h0;
    const dz31 = v3h0 * v1h1 - v1h0 * v3h1;

    const startY = Math.floor(minY); const startX = Math.floor(minX);
    const endY = Math.ceil(maxY); const endX = Math.ceil(maxX);
    const alphaDen = dx23 * v1h0 + dy23 * v1h1 + dz23;
    const betaDen =  dx31 * v2h0 + dy31 * v2h1 + dz31;
    const gammaDen = dx12 * v3h0 + dy12 * v3h1 + dz12;
    const width = this.dimension;
    let hb = this.heightBuffer;
    for (let y = startY; y <= endY; ++y)
    {
        const offset = width * y;
        for (let x = startX; x <= endX; ++x)
        {
            const alpha = (dx23 * x + dy23 * y + dz23) / alphaDen;
            const beta = (dx31 * x + dy31 * y + dz31) / betaDen;
            const gamma = (dx12 * x + dy12 * y + dz12) / gammaDen;

            if (alpha > 0 && beta > 0 && gamma > 0)
            {
                // const h = 255 * (alpha * v1h2 + beta * v2h2 + gamma * v3h2);
                // if (h < 0) h = 255;
                // hb[offset + x] = h;
                hb[offset + x] = 255 * (alpha * v1h2 + beta * v2h2 + gamma * v3h2);
            }
        }
    }
};

Rasterizer.prototype.initBuffers = function()
{
    const width = this.dimension;
    const height =  this.dimension;
    this.heightBuffer = new Int32Array(width * height);
    this.surfaceBuffer = new Uint8Array(width * height);
};

Rasterizer.prototype.heightPass = function(triMesh)
{
    const width = this.dimension;
    const height =  this.dimension;

    const start = TimeUtils.getTimeSecMillis();
    const nbTris = triMesh.length;
    const startTri = this.currentTriangle;
    for (let i = startTri; i < nbTris; ++i)
    {
        let t = triMesh[i];

        if (t.length !== 3) continue;

        this.drawTriangle(
            (0.5 + t[0][0]) * width - 0.5,
            (0.5 + t[0][1]) * height - 0.5,
            t[0][2],

            (0.5 + t[1][0]) * width - 0.5,
            (0.5 + t[1][1]) * height - 0.5,
            t[1][2],

            (0.5 + t[2][0]) * width - 0.5,
            (0.5 + t[2][1]) * height - 0.5,
            t[2][2],
        );

        if (i === nbTris - 1)
        {
            this.heightPassDone = true;
            this.currentTriangle = 0;
            // console.log(this.heightBuffer);
            return;
        }
        else
        {
            const current = TimeUtils.getTimeSecMillis();
            const delta = current - start;
            if (i - startTri > 1000 && delta > 8) {
                this.currentTriangle = i + 1;
                return;
            }
        }
    }
};

// TODO [GENERATION] lower this noise frequency
Rasterizer.prototype.precomputeNoiseTile = function(nbOctaves)
{
    // Noise tile = 256
    const height = this.noiseTileDimension;
    const width = this.noiseTileDimension;
    let tpng = this.tpng;
    this.noiseTile = new Float32Array(width * height);
    let buffer = this.noiseTile;

    const freq = 1 / 256;
    const wf = width * freq >> 0;

    for (let y = 0; y < height; ++y)
    {
        const offset = width * y;
        for (let x = 0; x < width; ++x)
        {
            buffer[offset + x] = tpng.sumOctaves(x * freq, y * freq, nbOctaves, wf);
        }
    }

    // Normalize
    let min = Infinity; let max = -Infinity;
    for (let i = 0; i < buffer.length; ++i) {
        let bi = buffer[i];
        if (bi > max) max = bi;
        if (bi < min) min = bi;
    }

    const range = max - min;
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = (buffer[i] - min) / range;
    }

    this.noiseTileReady = true;
};

Rasterizer.prototype.noisePass = function(factor)
{
    if (!this.noiseTileReady) {
        this.precomputeNoiseTile(5);
    }

    if (this.dimension % this.noiseTileDimension !== 0)
    {
        throw Error('Map dimension must be a multiple of the noise kernel dimension.');
    }

    let buffer = this.heightBuffer; let pattern = this.noiseTile;
    const height = this.dimension; const heightN = this.noiseTileDimension;
    const width = this.dimension; const widthN = this.noiseTileDimension;

    for (let y = 0; y < height; ++y)
    {
        const offset = width * y;
        const offsetNoise = widthN * (y % heightN);
        for (let x = 0; x < width; ++x)
        {
            const b = buffer[offset + x];
            if (b < 0) continue;
            buffer[offset + x] = b - factor * pattern[offsetNoise + x % widthN];
        }
    }
};

// Should be on the overlay and decrease water height.
Rasterizer.prototype.riverPass = function(rivers)
{
    const width = this.dimension;
    const height = this.dimension;
    const nbRivers = rivers.length;
    const riverHalfWidth = 8;
    const riverDepth = -10 / 256;
    // let hb = this.heightBuffer;
    for (let i = 0; i < nbRivers; ++i)
    {
        const r = rivers[i];
        const nbSegments = r.length - 1;
        for (let j = 0; j < nbSegments; ++j)
        {
            const p1 = r[j];
            const p2 = r[j + 1];

            let x1 = (0.5 + p1[0]) * width;
            let y1 = (0.5 + p1[1]) * height;
            let x2 = (0.5 + p2[0]) * width;
            let y2 = (0.5 + p2[1]) * height;

            const x = x2 - x1;
            const y = y2 - y1;
            const norm = Math.sqrt(x * x + y * y);
            const nvx = riverHalfWidth * x / norm;
            const nvy = riverHalfWidth * y / norm;
            x1 -= 0.1 * norm * x;
            x2 += 0.1 * norm * x;
            y1 -= 0.1 * norm * y;
            y2 += 0.1 * norm * y;

            const clockwiseX = nvy;
            const clockwiseY = -nvx;
            const counterClockwiseX = -nvy;
            const counterClockwiseY = nvx;

            // Rectangle 1 (clockwise)
            const upx1 = clockwiseX + x1; const upy1 = clockwiseY + y1;
            const upx2 = clockwiseX + x2; const upy2 = clockwiseY + y2;
            const h1 = 1 / 255; // hb[width * Math.floor(upy1) + Math.floor(upx1)] / 255;
            this.drawTriangle(
                x1, y1, riverDepth,
                x2, y2, riverDepth,
                upx1, upy1, h1,
            );
            this.drawTriangle(
                x2, y2, riverDepth,
                upx1, upy1, h1,
                upx2, upy2, 1 / 255,
                // hb[width * Math.floor(upy2) + Math.floor(upx2)] / 255,
            );

            // Rectangle 2 (counterclockwise)
            const dnx1 = counterClockwiseX + x1; const dny1 = counterClockwiseY + y1;
            const dnx2 = counterClockwiseX + x2; const dny2 = counterClockwiseY + y2;
            const h2 = 1 / 255; // hb[width * Math.floor(dny1) + Math.floor(dnx1)] / 255;
            this.drawTriangle(
                x1, y1, riverDepth,
                x2, y2, riverDepth,
                dnx1, dny1, h2,
            );
            this.drawTriangle(
                x2, y2, riverDepth,
                dnx1, dny1, h2,
                dnx2, dny2, 1 / 255,
                // hb[width * Math.floor(dny2) + Math.floor(dnx2)] / 255,
            );
        }
    }
};

Rasterizer.prototype.drawCity = function(cityX, cityY, cityRadius)
{
    this.drawCircle(cityX, cityY, cityRadius);
    this.drawCircle(cityX, cityY, cityRadius - 1);
    this.drawCircle(cityX, cityY, cityRadius - 2);
    // TODO [GENERATION] voronoi (inner walls); inside of cities with buildings
};

Rasterizer.prototype.cityPass = function(mesh, cities)
{
    const nbCities = cities.length;
    const width = this.dimension;
    const height = this.dimension;
    let tris = mesh.tris;
    for (let i = 0; i < nbCities; ++i)
    {
        let c = cities[i];

        // City center
        let t = tris[c];
        let cX = 0; let cY = 0;
        const l = t.length;
        if (l !== 2 && l !== 3) console.warn(`Uncommon tri length: ${l}.`);
        for (let j = 0; j < l; ++j) {
            cX += t[j][0];
            cY += t[j][1];
        }
        cX /= l; cY /= l;

        // City draw
        const cityRadius = i < 5 ? 30 : 15; // nb blocks
        const centerX = (0.5 + cX) * width - 0.5 >> 0;
        const centerY = (0.5 + cY) * height - 0.5 >> 0;
        this.drawCity(centerX, centerY, cityRadius);
    }
};

Rasterizer.prototype.seedChunkRandom = function(seed)
{
    this.rng2 = new Random(seed);
};

Rasterizer.prototype.computeChunkTreeDensity = function()
{
    const nbChunksX = this.dimension / this.chunkHeight;
    const nbChunksY = this.dimension / this.chunkWidth;
    const densityLength = nbChunksX * nbChunksY;
    this.treeDensities = new Uint8Array(densityLength);
    let td = this.treeDensities;
    let rng2 = this.rng2;
    for (let i = 0; i < densityLength; ++i) {
        const r = rng2.uniform();
        if (r > 0.99) {
            td[i] = CHUNK_TREES.FULL;
        } else if (r > 0.9) {
            td[i] = CHUNK_TREES.DENSE;
        } else if (r > 0.5) {
            td[i] = CHUNK_TREES.LIGHT;
        } else {
            td[i] = CHUNK_TREES.NONE;
        }
    }
};

Rasterizer.prototype.fillTrees = function(chunkI, chunkJ, nbTrees)
{
    const chunkHeight = this.chunkHeight;
    const chunkWidth = this.chunkWidth;
    const xStart = chunkI * chunkHeight; // const xEnd = xStart + 16;
    const yStart = chunkJ * chunkWidth; // const yEnd = yStart + 16;

    const w = this.dimension;
    let rng = this.rng2;
    let sb = this.surfaceBuffer;
    // TODO [GENERATION] jitter sampling
    for (let i = 0; i < nbTrees; ++i) {
        // never on a chunk border.
        const x = xStart + Math.floor(1 + rng.uniform() * (chunkWidth - 1));
        const y = yStart + Math.floor(1 + rng.uniform() * (chunkHeight - 1));
        sb[x * w + y] = 1; // only plant stump
    }
};

// TODO [GENERATION] combine with height and voronoi
Rasterizer.prototype.treePass = function()
{
    const nbChunksX = this.dimension / 16;
    const nbChunksY = this.dimension / 16;
    let td = this.treeDensities;
    let c = 0;
    for (let j = 0; j < nbChunksY; ++j) {
        for (let i = 0; i < nbChunksX; ++i) {
            switch (td[c]) {
                case CHUNK_TREES.NONE: break;
                case CHUNK_TREES.FULL: this.fillTrees(i, j, 15); break;
                case CHUNK_TREES.DENSE: this.fillTrees(i, j, 5); break;
                case CHUNK_TREES.LIGHT: this.fillTrees(i, j, 2); break;
            }
            ++c;
        }
    }
};

export { Rasterizer };
