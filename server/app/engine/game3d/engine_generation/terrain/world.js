
'use strict';

import { Tile }                       from './tile/tile';
import { Mesher }                     from './mesh';
import { defaultParams }              from './tile/terrain';
import { Rasterizer }                 from './tile/pixel';

let WorldMap = function()
{
    this.tiles = new Map();
    this.tileDimension = 1024;

    this.mesher = new Mesher();
    this.mesh = null;

    this.rasterizer = new Rasterizer(this.tileDimension);
    this.noiseTile = null;
};

WorldMap.prototype.seedWorld = function(seed)
{
    // TODO [GENERATION] link seed
    console.log(`TODO link seed ${seed}.`);

    // Init generators, voronoi and buffers.
    let mesher = this.mesher;
    let mesh = mesher.generateGoodMesh(16384,
        { width: 1, height: 1 }
    );
    // console.log(mesh);
    this.mesh = mesh;

    let rasterizer = this.rasterizer;
    rasterizer.precomputeNoiseTile(5);
    this.noiseTile = rasterizer.noiseTile;
};

WorldMap.prototype.stepTileGeneration = function(tile)
{
    if (!tile.ready)
        tile.stepGeneration();

    return tile.ready;
};

WorldMap.prototype.loadTile = function(i, j)
{
    let c = {
        params: defaultParams,
        mesh: this.mesh
    };
    let t = new Tile(i, j, this.tileDimension, c);
    t.setNoiseTile(this.noiseTile);

    t.processHeightMap();
    t.placeObjects();
    t.renderToRaster();
    this.tiles.set(`${i},${j}`, t);
};

WorldMap.prototype.makeNewTile = function(i, j)
{
    const tid = `${i},${j}`;
    let t = this.tiles.get(tid);
    if (t)
    {
        console.error(`Tile ${tid} already there.`);
    }
    t = new Tile(i, j, this.tileDimension, { params: defaultParams, mesh: this.mesh });
    t.setNoiseTile(this.noiseTile);
    t.needsGeneration = true;
    this.tiles.set(tid, t);
};

WorldMap.prototype.generateIfNeeded = function(x, y) // scene, camera)
{
    // let p = camera.position;
    // const x = p.x;
    // const y = p.y;
    const i = Math.round(x);
    const j = Math.round(y);
    const tid = `${i},${j}`;
    let t = this.tiles.get(tid);
    // console.log(t);

    if (!t)
    {
        t = new Tile(i, j, this.tileDimension, { params: defaultParams, mesh: this.mesh });
        t.setNoiseTile(this.noiseTile);
        this.tiles.set(tid, t);
    }
    else if (!t.ready)
    {
        t.stepGeneration();
    }
    else
    {
        // let buffer = this.makeImageBufferFromRaster(
        //     t,
        //     t.getRaster(),
        //     t.getSurfaceRaster()
        // );
    }
};

WorldMap.prototype.getTiles = function()
{
    return this.tiles;
};

WorldMap.prototype.makeImageBufferFromRaster = function(
    tile, heightBuffer, surfaceBuffer
)
{
    const width = tile.dimension;
    const height = tile.dimension;
    let rb = heightBuffer;
    let sb = surfaceBuffer;
    let buffer = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < height; ++i) for (let j = 0; j < width; ++j)
    {
        const s = i * width + j;
        const stride = s * 4;
        const si = (width - i - 1) * width + j;
        const v = rb[si] >> 0;
        const t = sb[si] >> 0;
        if (v > 0) {
            buffer[stride] = t < 1 ? v : 255;
            buffer[stride + 1] = t < 1 ? v : 0;
            buffer[stride + 2] = t < 1 ? v : 0;
        } else {
            buffer[stride] = 0;
            buffer[stride + 1] = 0;
            buffer[stride + 2] = 255;
        }
        buffer[stride + 3] = 255;
    }

    return buffer;
};

export { WorldMap };
