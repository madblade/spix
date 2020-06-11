/**
 *
 */


'use strict';

import { WorldType, BlockType, HillType, TreeType } from '../../model_world/model';

class SimplePerlin
{
    static p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194,
        233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10,
        23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
        203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,
        174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
        27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
        133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
        65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
        89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
        198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5,
        202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16,
        58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
        248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172,
        9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
        178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238,
        210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
        14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84,
        204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
        93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194,
        233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10,
        23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
        203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,
        174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
        27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
        133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
        65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
        89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
        198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5,
        202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16,
        58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
        248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172,
        9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
        178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238,
        210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
        14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84,
        204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
        93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];

    static fade(t)
    {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    static lerp(t, a, b)
    {
        return a + t * (b - a);
    }

    static grad(hash, x, y, z)
    {
        let h = hash & 15;
        let u = h < 8 ? x : y;
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    static noise(x, y, z)
    {
        let fade = SimplePerlin.fade;
        let lerp = SimplePerlin.lerp;
        let grad = SimplePerlin.grad;
        let p = SimplePerlin.p;

        const floorX = Math.floor(x);
        const floorY = Math.floor(y);
        const floorZ = Math.floor(z);

        const X = floorX & 255;
        const Y = floorY & 255;
        const Z = floorZ & 255;

        x -= floorX;
        y -= floorY;
        z -= floorZ;

        const xMinus1 = x - 1;
        const yMinus1 = y - 1;
        const zMinus1 = z - 1;

        const u = fade(x);
        const v = fade(y);
        const w = fade(z);

        const A = p[X] + Y;
        const AA = p[A] + Z;
        const AB = p[A + 1] + Z;

        const B = p[X + 1] + Y;
        const BA = p[B] + Z;
        const BB = p[B + 1] + Z;

        return lerp(w,
            lerp(v,
                lerp(u, grad(p[AA], x, y, z), grad(p[BA], xMinus1, y, z)),
                lerp(u, grad(p[AB], x, yMinus1, z), grad(p[BB], xMinus1, yMinus1, z))),

            lerp(v,
                lerp(u, grad(p[AA + 1], x, y, zMinus1), grad(p[BA + 1], xMinus1, y, z - 1)),
                lerp(u, grad(p[AB + 1], x, yMinus1, zMinus1), grad(p[BB + 1], xMinus1, yMinus1, zMinus1)))
        );
    }

    static addTree2D(blocks, x, y, bl, dx, dz, xy, normalSize, wood, leaves)
    {
        if (x < 2 || x >= dx - 2 || y < 2 || y >= dx - 2) return; // square chunks!
        for (let zz = Math.min(bl + 3, dz); zz < Math.min(bl + 7, dz); ++zz)
        {
            const off = normalSize * zz;
            for (let ox = -2; ox <= 2; ox++) {
                for (let oy = -2; oy <= 2; oy++) {
                    let d = ox * ox + oy * oy +
                        (zz - (bl + 4)) * (zz - (bl + 4));
                    if (d < 11) {
                        const currentBlock = ox + x + (oy + y) * dx + off;
                        blocks[currentBlock] = leaves;
                    }
                }
            }
        }
        for (let zz = bl; zz < Math.min(bl + 4, dz); ++zz)
        {
            const currentBlock = xy + normalSize * zz;
            blocks[currentBlock] = wood;
        }
    }

    static simpleGeneration2D(
        chunk, worldId, worldInfo,
        perlinIntensity, shuffleChunks, blocks)
    {
        let dims = chunk.dimensions;
        const dx = dims[0];
        const dy = dims[1];
        const dz = dims[2];
        const ci = chunk.chunkI;
        const cj = chunk.chunkJ;
        const ck = chunk.chunkK;
        const offsetX = dx * ci; const offsetY = dy * cj; const offsetZ = dz * ck;

        // const air = BlockType.AIR;
        const stone = BlockType.STONE;
        const grass = BlockType.GRASS;
        const water = BlockType.WATER;
        const iron = BlockType.IRON;
        const sand = BlockType.SAND;
        const wood = BlockType.WOOD;
        const leaves = BlockType.LEAVES;
        // const planks = BlockType.PLANKS;

        // Fill with grass on main world, sand everywhere else.
        const mainBlockId = parseInt(worldId, 10) === -1 ? grass : sand;

        const normalSize = dx * dy;

        let data = [];
        let quality = 2;
        // const z = shuffleChunks ? Math.random() * 100 : 50;
        const z = 4 * (shuffleChunks ? Math.random() * dz : Math.floor(dz / 2));
        const hasTrees = worldInfo.trees === TreeType.SOME_TREES;

        for (let i = 0; i < normalSize; ++i) data[i] = 0;
        for (let iteration = 0; iteration < 4; ++iteration)
        {
            for (let i = 0; i < normalSize; ++i) {
                let x = offsetX + i % dx;
                let y = offsetY + (i / dx | 0); // / priority > | priority
                data[i] += SimplePerlin.noise(x / quality, y / quality, z) * quality;
            }

            quality *= 4;
        }

        // Tree noise
        let noise = (x, y) => {
            const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
            return s - Math.floor(s);
        };

        for (let x = 0; x < dx; ++x) {
            for (let y = 0; y < dy; ++y) {
                let h = dz / 2 + (data[x + y * dx] * perlinIntensity | 0);
                let rockLevel = Math.floor(5 * h / 6);
                const xy = x + y * dx;

                h -= offsetZ;
                rockLevel -= offsetZ;
                let rl = Math.max(0, Math.min(rockLevel, dz));
                for (let zz = 0; zz < rl; ++zz) {
                    const currentBlock = xy + normalSize * zz;

                    // Rock.
                    blocks[currentBlock] = stone;

                    // Iron.
                    if (Math.random() > 0.99) blocks[currentBlock] = iron;
                }

                let bl = Math.max(0, Math.min(h, dz));
                for (let zz = rl; zz < bl; ++zz)
                {
                    // Grass or sand.
                    const currentBlock = xy + normalSize * zz;
                    // if (zz === bl - 1)
                    //     blocks[currentBlock] = water;
                    // else
                    blocks[currentBlock] = mainBlockId;
                }

                if (hasTrees && bl >= 16 && rl > 0 && x > 1 && x < dx - 2 && y > 1 && y < dy - 2)
                {
                    const rand = noise(x, y);
                    if (rand > 0.99)
                    {
                        SimplePerlin.addTree2D(blocks, x, y, bl, dx, dz, xy, normalSize, wood, leaves);
                    }
                }

                if (bl < 16 && rl > 0)
                {
                    for (let zz = bl; zz < 16; ++zz) {
                        // Grass or sand.
                        const currentBlock = xy + normalSize * zz;
                        if (zz === bl)
                            blocks[currentBlock] = sand;
                        else
                            blocks[currentBlock] = water;
                    }
                }
            }
        }
    }

    static simpleGeneration3D(
        chunk, worldId, worldInfo, perlinIntensity, shuffleChunks, blocks
    )
    {
        let directions = [];

        let dims = chunk.dimensions;
        const dx = dims[0]; const dy = dims[1]; const dz = dims[2];
        const ci = chunk.chunkI; const cj = chunk.chunkJ; const ck = chunk.chunkK;
        const offsetX = dx * ci; const offsetY = dy * cj; const offsetZ = dz * ck;

        const center = worldInfo.center;
        const radius = worldInfo.radius;
        const air = BlockType.AIR;
        const stone = BlockType.STONE;
        const grass = BlockType.GRASS;
        const water = BlockType.WATER;
        const iron = BlockType.IRON;
        const sand = BlockType.SAND;
        const obsidian = BlockType.OBSIDIAN;
        let abs = Math.abs;
        let max = Math.max;

        const deltaX = center.x - parseInt(ci, 10); const adx = abs(deltaX);
        const deltaY = center.y - parseInt(cj, 10); const ady = abs(deltaY);
        const deltaZ = center.z - parseInt(ck, 10); const adz = abs(deltaZ);

        if (
            (max(adx, max(ady, adz)) > radius ||
            (adx === radius) + (ady === radius) + (adz === radius) < 2) &&
            (adx > radius - 1) + (ady > radius - 1) + (adz > radius - 1) > 1
        )
        {
            blocks.fill(air);
            chunk.isEmpty = true;
            return;
        }

        // full stone inside the cubeworld
        if (adx < radius && ady < radius && adz < radius) {
            if (adx < adz && ady < adz && adz > 0) {
                directions.push(ck > center.z ? 3 : -3);
            } else if (adx < ady && adz < ady && ady > 0) {
                directions.push(cj > center.y ? 2 : -2);
            } else if (ady < adx && adz < adx && adx > 0) {
                directions.push(ci > center.x ? 1 : -1);
            } else {
                blocks.fill(stone);
                chunk.isFull = true;
                return;
            }
        }

        // TODO manage [GENERATION] full / empty chunks

        if (adx === radius)
            directions.push(ci > center.x ? 1 : -1);
        if (ady === radius)
            directions.push(cj > center.y ? 2 : -2);
        if (adz === radius)
            directions.push(ck > center.z ? 3 : -3);

        // Fill with grass on main world, sand everywhere else.
        const mainBlockId = parseInt(worldId, 10) === -1 ? grass : sand;
        const ijS = dx * dy;
        const nbDirections = directions.length;

        if (nbDirections === 3)
        {
            // Eighth-full generation.
            for (let lx = dx / 2, i = directions[0] > 0 ? 0 : lx, cx = 0; cx < lx; ++cx, ++i) {
                for (let ly = dy / 2, j = directions[1] > 0 ? 0 : ly, cy = 0; cy < ly; ++cy, ++j)
                    for (let lz = dz / 2, k = directions[2] > 0 ? 0 : lz, cz = 0; cz < lz; ++cz, ++k)
                        blocks[i + j * dx + k * ijS] = obsidian;
            }
        }
        else if (nbDirections === 2)
        {
            // Quarter-full generation.
            // 1 or 2, then 2 or 3!
            for (
                let a1 = abs(directions[0]),
                    l1 = a1 === 1 ? dx / 2 : dy / 2,
                    ij = directions[0] > 0 ? 0 : l1,
                    c1 = 0;
                c1 < l1; ++c1, ++ij
            )
                for (
                    let a2 = abs(directions[1]),
                        l2 = a2 === 2 ? dy / 2 : dz / 2,
                        jk = directions[1] > 0 ? 0 : l2,
                        c2 = 0;
                    c2 < l2; ++c2, ++jk
                )
                {
                    if (a1 > 1) {
                        const ijk = ij * dx + jk * ijS;
                        for (let x = 0; x < dx; ++x) blocks[x + ijk] = obsidian;
                    } else if (a2 > 2) {
                        const ijk = ij + jk * ijS;
                        for (let y = 0; y < dy; ++y) blocks[ijk + y * dx] = obsidian;
                    } else {
                        const ijk = ij + jk * dx;
                        for (let z = 0; z < dz; ++z) blocks[ijk + z * ijS] = obsidian;
                    }
                }
        }
        else if (nbDirections === 1)
        {
            const v1 = directions[0]; // For signum & value.
            const a1 = abs(v1);
            let [d1, d2, d3, normalSize, offset1, offset2, offset3, perm] = a1 > 2 ?
                [dx, dy, dz, dx * dy, offsetX, offsetY, offsetZ, 0] : a1 > 1 ?
                    [dx, dz, dy, dx * dz, offsetX, offsetZ, offsetY, 1] :
                    [dy, dz, dx, dy * dz, offsetY, offsetZ, offsetX, 2]; // Can factor normalSize outside.

            let data = [];
            let quality = 2;
            // const z = shuffleChunks ? Math.random() * 100 : 50;
            const z = 4 * (shuffleChunks ? Math.random() * d3 : Math.floor(d3 / 2));

            for (let i = 0; i < normalSize; ++i) data[i] = 0;
            for (let iteration = 0; iteration < 4; ++iteration)
            {
                for (let i = 0; i < normalSize; ++i) {
                    let x = offset1 + i % d1;
                    let y = offset2 + (i / d1 | 0); // / priority > | priority
                    data[i] += SimplePerlin.noise(x / quality, y / quality, z) * quality;
                }

                quality *= 4;
            }

            // Get vertical generation direction.
            let getStride;
            if (v1 > 0)
            {
                if (perm === 0) getStride = (x1, y1, z1) => z1 * dx * dy + y1 * dx + x1;
                else if (perm === 1) getStride = (x1, y1, z1) => y1 * dx * dy + z1 * dx + x1;
                else getStride = (x1, y1, z1) => y1 * dx * dy + x1 * dx + z1;
            }
            else if (v1 < 0)
            {
                if (perm === 0) getStride =  (x1, y1, z1) => (dz - 1 - z1) * dx * dy + y1 * dx + x1;
                else if (perm === 1) getStride = (x1, y1, z1) => y1 * dx * dy + (dz - 1 - z1) * dx + x1;
                else getStride = (x1, y1, z1) => y1 * dx * dy + x1 * dx + (dz - 1 - z1);
            }

            let r = parseInt(radius, 10);
            switch (v1) {
                case 1:  offset3 = (-center.x - r + parseInt(ci, 10)) * d1; break;
                case -1: offset3 = (center.x - r - parseInt(ci, 10)) * d1; break;
                case 2:  offset3 = (-center.y - r + parseInt(cj, 10)) * d2; break;
                case -2: offset3 = (center.y - r - parseInt(cj, 10)) * d2; break;
                case 3:  offset3 = (-center.z - r + parseInt(ck, 10)) * d3; break;
                case -3: offset3 = (center.z - r - parseInt(ck, 10)) * d3; break;
            }

            for (let x = 0; x < d1; ++x) {
                for (let y = 0; y < d2; ++y)
                {
                    const h = d3 / 2 + (data[x + y * d1] * perlinIntensity | 0) - offset3;
                    const rockLevel = Math.floor(5 * h / 6) - offset3;
                    let rl = Math.max(0, Math.min(rockLevel, d3));
                    for (let zz = 0; zz < rl; ++zz) {
                        const currentBlock = getStride(x, y, zz);

                        // Rock.
                        blocks[currentBlock] = stone;

                        // Iron.
                        if (Math.random() > 0.99) blocks[currentBlock] = iron;
                    }

                    let bl = Math.max(0, Math.min(h, d3));
                    for (let zz = rl; zz < bl; ++zz) {
                        // Grass or sand.
                        const currentBlock = getStride(x, y, zz);
                        // if (zz === bl - 1)
                        //     blocks[currentBlock] = water;
                        // else
                        blocks[currentBlock] = mainBlockId;
                    }

                    if (bl < 8) {
                        for (let zz = bl; zz < 8; ++zz) {
                            // Grass or sand.
                            const currentBlock = getStride(x, y, zz);
                            if (zz <= bl)
                                blocks[currentBlock] = sand;
                            else
                                blocks[currentBlock] = water;
                        }
                    }
                }
            }
        }
    }

    static simplePerlinGeneration(chunk, shuffleChunks, worldId, worldInfo)
    {
        let dims = chunk.dimensions;
        const dx = dims[0];
        const dy = dims[1];
        const dz = dims[2];

        // Create blocks.
        let blocks = new Uint8Array(dx * dy * dz);

        // Detect intensity
        const hillsType = worldInfo.hills;
        let perlinIntensity;
        switch (hillsType)
        {
            case HillType.NO_HILLS: perlinIntensity = 0; break;
            case HillType.REGULAR_HILLS: perlinIntensity = 0.2; break;
            case HillType.GIANT_HILLS: perlinIntensity = 1.0; break;
            default: perlinIntensity = 0.1; break;
        }

        // Detect cube or flat world.
        const worldType = worldInfo.type;
        switch (worldType)
        {
            case WorldType.FLAT:
                SimplePerlin.simpleGeneration2D(
                    chunk, worldId, worldInfo,
                    perlinIntensity, shuffleChunks, blocks
                );
                // 1: x, 2: y, 3: z, 4: full, 5: empty
                break;
            case WorldType.CUBE:
                SimplePerlin.simpleGeneration3D(
                    chunk, worldId, worldInfo,
                    perlinIntensity, shuffleChunks, blocks
                );

                break;
            default:
                console.error('[Generator Simple Perlin] Unknown world type.');
        }

        chunk.blocks = blocks;
        chunk.blocksReady = true;
    }
}

export default SimplePerlin;
