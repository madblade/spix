
'use strict';

import { Random } from './random';

const BIOMES = Object.freeze({
    NOTHING: -1,

    OCEAN: 0,
    SHORE: 1,
    GRASSLANDS: 2,
    HILLS: 3,
    WOOD: 4,
    FOREST: 5,

    MOUNTAINS: 10,
    DESERT: 11,
});

let BiomePlacer = function(textSeed)
{
    this.buffer = [];
    this.rng = new Random(textSeed);
};

BiomePlacer.prototype.initBuffer = function(length)
{
    this.buffer = new Uint32Array(length);
};

BiomePlacer.prototype.computeBiomes = function(mesh, tile)
{
    let h = tile.buffer; // heightmap can be used to determine chunk
    const l = h.length;
    let rng = this.rng;
    let biomes = this.buffer;
    for (let i = 0; i < l; ++i)
    {
        const r = rng.uniform();
        if (r > 0.99) {
            biomes[i] = BIOMES.DESERT;
        } else if (r > 0.7) {
            biomes[i] = BIOMES.FOREST;
        } else {
            biomes[i] = BIOMES.GRASSLANDS;
        }
    }
};

BiomePlacer.prototype.getBiomes = function()
{
    return this.buffer;
};

export { BiomePlacer };
