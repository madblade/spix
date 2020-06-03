
'use strict';

import { Random }                   from './random';
import { max, mean, min } from '../math';

let FieldModifier = function(
    mesher, seed
)
{
    if (!mesher) throw Error('Invalid argument');

    this.buffer = [];

    seed = seed || 'rough';
    this.randomGenerator = new Random(seed);

    this.mesher = mesher;
    this.nbMountains = 0;
};

FieldModifier.prototype.resetBuffer = function(newBufferLength)
{
    if (this.buffer.length !== newBufferLength)
        this.buffer = new Float64Array(newBufferLength);
    else this.buffer.fill(0);
};

FieldModifier.prototype.swapBuffers = function(otherObject)
{
    let tempBuffer = this.buffer;
    this.buffer = otherObject.buffer;
    otherObject.buffer = tempBuffer;
};

FieldModifier.prototype.addScalar = function(mesh, buffer, scalar)
{
    for (let i = 0, l = buffer.length; i < l; i++)
    {
        buffer[i] += scalar;
    }
};

FieldModifier.prototype.apply1D = function(mesh, buffer, mapper1D)
{
    for (let i = 0, l = buffer.length; i < l; i++)
    {
        const b = buffer[i];
        buffer[i] = mapper1D(b);
    }
};

FieldModifier.prototype.apply2D = function(mesh, buffer, mapper2D)
{
    let vxs = mesh.vxs;
    for (let i = 0, l = vxs.length, v; i < l; i++) {
        v = vxs[i];
        buffer[i] = mapper2D(v);
    }
};

FieldModifier.prototype.addSlope = function(mesh, buffer, tileX, tileY)
{
    let vxs = mesh.vxs;

    let cx = tileX % 2 === 0 ? 0.5 : -0.5;
    let cy = tileY % 2 === 0 ? 0.5 : -0.5;
    for (let i = 0, l = vxs.length, v; i < l; i++) {
        v = vxs[i];
        buffer[i] += Math.sqrt(
            Math.pow(v[0] - cx, 2) + Math.pow(v[1] - cy, 2)
        );
    }
};

FieldModifier.prototype.addCone = function(mesh, buffer, slope)
{
    this.apply2D(mesh, buffer,
        v => Math.sqrt(
            Math.pow(v[0], 2) + Math.pow(v[1], 2)
        ) * slope);
};

FieldModifier.prototype.resetField = function(mesh)
{
    let buffer = mesh.buffer;
    for (let i = 0, l = buffer.length; i < l; ++i)
        buffer[i] = 0;
};

FieldModifier.prototype.addMountains = function(mesh, buffer, n, r)
{
    const rng = this.randomGenerator;

    r = r || 0.05;
    let mounts = [];
    for (let i = 0; i < n; i++)
    {
        let r1 = rng.uniform();
        let r2 = rng.uniform();
        mounts.push([mesh.extent.width * (r1 - 0.5) * 0.85, mesh.extent.height * (r2 - 0.5) * 0.85]);
    }

    const vxs = mesh.vxs;
    const r22 = 1 / (2 * r * r);
    const vl = vxs.length;
    for (let i = 0; i < vl; i++)
    {
        let p = vxs[i];
        const px = p[0];
        const py = p[1];

        for (let j = 0; j < n; j++)
        {
            const m = mounts[j];
            const dx = px - m[0];
            const dy = py - m[1];

            buffer[i] +=
                Math.pow(
                    Math.exp(-(
                        Math.pow(dx, 2) +
                            Math.pow(dy, 2)
                    ) * r22),
                    2
                );
        }
    }

    this.nbMountains += n;
};

FieldModifier.prototype.normalize = function(mesh, buffer)
{
    let lo = min(buffer);
    let hi = max(buffer);
    this.apply1D(mesh, buffer, x => (x - lo) / (hi - lo));
};

FieldModifier.prototype.peaky = function(mesh, buffer)
{
    this.normalize(mesh, buffer);
    this.apply1D(mesh, buffer, Math.sqrt);
};

FieldModifier.prototype.relax = function(mesh, tile)
{
    const mesher = this.mesher;

    let field = tile.buffer;
    let length = field.length;
    this.resetBuffer(length);
    let newh = this.buffer;

    for (let i = 0; i < length; i++)
    {
        let nbs = mesher.neighbours(mesh, i);
        if (nbs.length < 3) {
            newh[i] = field[i];
            continue;
        }
        newh[i] = mean(nbs, field);
    }

    this.swapBuffers(tile);
};

FieldModifier.prototype.setSeaLevel = function(mesh, buffer) // , q)
{
    // let delta = quantile2(mesh, q);
    // console.log(delta);
    let delta = 0.3;
    this.addScalar(mesh, buffer, -delta);
};

export {
    FieldModifier,
};
