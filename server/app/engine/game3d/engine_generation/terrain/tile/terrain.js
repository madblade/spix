
'use strict';

import { Random } from './random';

let TerrainGenerator = function(
    mesher, fieldModifier, eroder, seed
)
{
    if (!mesher || !fieldModifier || !eroder) throw Error('Invalid argument');

    this.buffer = [];

    seed = seed || 'terrain';
    this.randomGenerator = new Random(seed);

    this.mesher = mesher;
    this.fieldModifier = fieldModifier;
    this.eroder = eroder;
};

TerrainGenerator.prototype.randomVector = function(scale)
{
    let r1 = this.randomGenerator.rnorm();
    return [scale * r1, scale * r1];
};

TerrainGenerator.prototype.runif = function(lo, hi)
{
    let r = this.randomGenerator.uniform();
    return lo + r * (hi - lo);
};

TerrainGenerator.prototype.generateCoast = function(params)
{
    const mesher = this.mesher;
    const fieldModifier = this.fieldModifier;
    const eroder = this.eroder;

    let mesh = mesher.generateGoodMesh(params.npts, params.extent);

    fieldModifier.resetBuffer(mesh.tris.length);
    fieldModifier.addSlope(mesh, this.randomVector(4));
    fieldModifier.addCone(mesh, this.runif(-1, -1));
    fieldModifier.addMountains(mesh, 50);
    for (let i = 0; i < 10; i++)
    {
        fieldModifier.relax(mesh);
    }

    fieldModifier.peaky(mesh);

    let el = this.runif(0, 0.1);
    eroder.doErosion(mesh, el, 5);

    let sl = this.runif(0.2, 0.6);
    fieldModifier.setSeaLevel(mesh, sl);

    eroder.fillSinks(mesh);
    eroder.cleanCoast(mesh, 3);

    console.log(mesh);
    return mesh;
};

TerrainGenerator.prototype.generateUneroded = function(mainSize)
{
    const mesher = this.mesher;
    const fieldModifier = this.fieldModifier;
    const eroder = this.eroder;

    let mesh = mesher.generateGoodMesh(mainSize);
    fieldModifier.addSlope(mesh, this.randomVector(4));
    fieldModifier.addCone(mesh, this.runif(-1, 1));
    fieldModifier.addMountains(mesh, 50);
    fieldModifier.peaky(mesh);
    eroder.fillSinks(mesh);
    fieldModifier.setSeaLevel(mesh, 0.5);
    return mesh;
};

let defaultExtent = {
    width: 1,
    height: 1
};

let defaultParams = {
    extent: defaultExtent,
    npts: 16384,
    ncities: 15,
    nterrs: 5,
    fontsizes: {
        region: 40,
        city: 25,
        town: 20
    }
};

export {
    TerrainGenerator,
    defaultExtent, defaultParams
};
