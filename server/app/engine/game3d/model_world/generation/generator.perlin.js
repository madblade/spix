/**
 * Copyright (c) 2008 Casey Duncan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var seedrandom = require('seedrandom');

class Perlin {

    static F2 = 0.3660254037844386;
    static G2 = 0.21132486540518713;
    static F3 = (1.0 / 3.0);
    static G3 = (1.0 / 6.0);
    static ASSIGN = (a, v0, v1, v2) => { (a)[0] = v0; (a)[1] = v1; (a)[2] = v2 };
    static DOT3 = (v1, v2) => ((v1)[0] * (v2)[0] + (v1)[1] * (v2)[1] + (v1)[2] * (v2)[2]);
    static RAND_MAX = 1.0;

    static GRAD3 = () => [
        [ 1, 1, 0], [-1, 1, 0], [ 1,-1, 0], [-1,-1, 0],
        [ 1, 0, 1], [-1, 0, 1], [ 1, 0,-1], [-1, 0,-1],
        [ 0, 1, 1], [ 0,-1, 1], [ 0, 1,-1], [ 0,-1,-1],
        [ 1, 0,-1], [-1, 0,-1], [ 0,-1, 1], [ 0, 1, 1]
    ];

    static PERM = () => [ // unsigned char
        151, 160, 137,  91,  90,  15, 131,  13, 201,  95,  96,  53, 194, 233,   7, 225,
        140,  36, 103,  30,  69, 142,   8,  99, 37, 240,  21,  10,  23, 190,   6, 148,
        247, 120, 234,  75,   0,  26, 197,  62, 94, 252, 219, 203, 117,  35,  11,  32,
        57, 177,  33,  88, 237, 149,  56,  87, 174,  20, 125, 136, 171, 168,  68, 175,
        74, 165,  71, 134, 139,  48,  27, 166, 77, 146, 158, 231,  83, 111, 229, 122,
        60, 211, 133, 230, 220, 105,  92,  41, 55,  46, 245,  40, 244, 102, 143,  54,
        65,  25,  63, 161,   1, 216,  80,  73, 209,  76, 132, 187, 208,  89,  18, 169,
        200, 196, 135, 130, 116, 188, 159,  86, 164, 100, 109, 198, 173, 186,   3,  64,
        52, 217, 226, 250, 124, 123,   5, 202, 38, 147, 118, 126, 255,  82,  85, 212,
        207, 206,  59, 227,  47,  16,  58,  17, 182, 189,  28,  42, 223, 183, 170, 213,
        119, 248, 152,   2,  44, 154, 163,  70, 221, 153, 101, 155, 167,  43, 172,   9,
        129,  22,  39, 253,  19,  98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
        218, 246,  97, 228, 251,  34, 242, 193, 238, 210, 144,  12, 191, 179, 162, 241,
        81,  51, 145, 235, 249,  14, 239, 107, 49, 192, 214,  31, 181, 199, 106, 157,
        184,  84, 204, 176, 115, 121,  50,  45, 127,   4, 150, 254, 138, 236, 205,  93,
        222, 114,  67,  29,  24,  72, 243, 141, 128, 195,  78,  66, 215,  61, 156, 180,
        151, 160, 137,  91,  90,  15, 131,  13, 201,  95,  96,  53, 194, 233,   7, 225,
        140,  36, 103,  30,  69, 142,   8,  99, 37, 240,  21,  10,  23, 190,   6, 148,
        247, 120, 234,  75,   0,  26, 197,  62, 94, 252, 219, 203, 117,  35,  11,  32,
        57, 177,  33,  88, 237, 149,  56,  87, 174,  20, 125, 136, 171, 168,  68, 175,
        74, 165,  71, 134, 139,  48,  27, 166, 77, 146, 158, 231,  83, 111, 229, 122,
        60, 211, 133, 230, 220, 105,  92,  41, 55,  46, 245,  40, 244, 102, 143,  54,
        65,  25,  63, 161,   1, 216,  80,  73, 209,  76, 132, 187, 208,  89,  18, 169,
        200, 196, 135, 130, 116, 188, 159,  86, 164, 100, 109, 198, 173, 186,   3,  64,
        52, 217, 226, 250, 124, 123,   5, 202, 38, 147, 118, 126, 255,  82,  85, 212,
        207, 206,  59, 227,  47,  16,  58,  17, 182, 189,  28,  42, 223, 183, 170, 213,
        119, 248, 152,   2,  44, 154, 163,  70, 221, 153, 101, 155, 167,  43, 172,   9,
        129,  22,  39, 253,  19,  98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
        218, 246,  97, 228, 251,  34, 242, 193, 238, 210, 144,  12, 191, 179, 162, 241,
        81,  51, 145, 235, 249,  14, 239, 107, 49, 192, 214,  31, 181, 199, 106, 157,
        184,  84, 204, 176, 115, 121,  50,  45, 127,   4, 150, 254, 138, 236, 205,  93,
        222, 114,  67,  29,  24,  72, 243, 141, 128, 195,  78,  66, 215,  61, 156, 180
    ];

    static _permMap = {};
    static getPerm(handle) {
        return Perlin._permMap[handle];
    }
    static setPerm(handle, permMap) {
        Perlin._permMap[handle] = permMap;
    }

    static seed(handle, x) { // unsigned int
        let PERM = Perlin.PERM();
        let RAND_MAX = 1.0;
        var rng = seedrandom(x);

        for (let i = 0; i < 256; i++) {
            PERM[i] = i;
        }
        for (let i = 255; i > 0; i--) {
            let j;
            let n = i + 1;
            while (n <= (j = Math.floor( rng() * n ) )) {}

            let a = PERM[i];
            let b = PERM[j];
            PERM[i] = b;
            PERM[j] = a;
        }

        for (let i = 0; i<256; ++i) {PERM[i+256] = PERM[i];}

        Perlin.setPerm(handle, PERM);
    }

    static noise2(handle, x, y) { // float, float, float
        let floorf = x => parseInt(Math.floor(x));
        const PERM = Perlin.getPerm(handle);
        let GRAD3 = Perlin.GRAD3();

        let i1, j1, I, J, c;
        let s = (x + y) * Perlin.F2;
        let i = floorf(x + s);
        let j = floorf(y + s);
        let t = (i + j) * Perlin.G2;

        let xx = [0., 0., 0.];
        let yy = [0., 0., 0.];
        let f = [0., 0., 0.];
        let noise = [0., 0., 0.];
        let g = [0., 0., 0.];

        xx[0] = x - (i - t);
        yy[0] = y - (j - t);

        i1 = xx[0] > yy[0];
        j1 = xx[0] <= yy[0];

        xx[2] = xx[0] + Perlin.G2 * 2.0 - 1.0;
        yy[2] = yy[0] + Perlin.G2 * 2.0 - 1.0;
        xx[1] = xx[0] - i1 + Perlin.G2;
        yy[1] = yy[0] - j1 + Perlin.G2;

        I = i & 255;
        J = j & 255;
        g[0] = PERM[I + PERM[J]] % 12;
        g[1] = PERM[I + i1 + PERM[J + j1]] % 12;
        g[2] = PERM[I + 1 + PERM[J + 1]] % 12;

        for (c = 0; c <= 2; c++) {
            f[c] = 0.5 - xx[c]*xx[c] - yy[c]*yy[c];
        }

        for (c = 0; c <= 2; c++) {
            if (f[c] > 0) {
                noise[c] = f[c] * f[c] * f[c] * f[c] *
                    (GRAD3[g[c]][0] * xx[c] + GRAD3[g[c]][1] * yy[c]);
            }
        }

        return (noise[0] + noise[1] + noise[2]) * 70.0;
    }

    static noise3(handle, x, y, z) {
        let floorf = x => parseInt(Math.floor(x));
        const PERM = Perlin.getPerm(handle);
        const GRAD3 = Perlin.GRAD3();

        let c, o1 = [0, 0, 0], o2 = [0, 0, 0], g = [0, 0, 0, 0], I, J, K;
        let f = [0., 0., 0.], noise = [0., 0., 0., 0.];
        let s = (x + y + z) * Perlin.F3;
        let i = floorf(x + s);
        let j = floorf(y + s);
        let k = floorf(z + s);
        let t = (i + j + k) * Perlin.G3;

        let pos = [
            [0., 0., 0.],
            [0., 0., 0.],
            [0., 0., 0.],
            [0., 0., 0.]
        ];

        pos[0][0] = x - (i - t);
        pos[0][1] = y - (j - t);
        pos[0][2] = z - (k - t);

        if (pos[0][0] >= pos[0][1]) {
            if (pos[0][1] >= pos[0][2]) {
                Perlin.ASSIGN(o1, 1, 0, 0);
                Perlin.ASSIGN(o2, 1, 1, 0);
            } else if (pos[0][0] >= pos[0][2]) {
                Perlin.ASSIGN(o1, 1, 0, 0);
                Perlin.ASSIGN(o2, 1, 0, 1);
            } else {
                Perlin.ASSIGN(o1, 0, 0, 1);
                Perlin.ASSIGN(o2, 1, 0, 1);
            }
        } else {
            if (pos[0][1] < pos[0][2]) {
                Perlin.ASSIGN(o1, 0, 0, 1);
                Perlin.ASSIGN(o2, 0, 1, 1);
            } else if (pos[0][0] < pos[0][2]) {
                Perlin.ASSIGN(o1, 0, 1, 0);
                Perlin.ASSIGN(o2, 0, 1, 1);
            } else {
                Perlin.ASSIGN(o1, 0, 1, 0);
                Perlin.ASSIGN(o2, 1, 1, 0);
            }
        }

        for (c = 0; c <= 2; c++) {
            pos[3][c] = pos[0][c] - 1.0 + 3.0 * Perlin.G3;
            pos[2][c] = pos[0][c] - o2[c] + 2.0 * Perlin.G3;
            pos[1][c] = pos[0][c] - o1[c] + Perlin.G3;
        }

        I = i & 255;
        J = j & 255;
        K = k & 255;
        g[0] = PERM[I + PERM[J + PERM[K]]] % 12;
        g[1] = PERM[I + o1[0] + PERM[J + o1[1] + PERM[o1[2] + K]]] % 12;
        g[2] = PERM[I + o2[0] + PERM[J + o2[1] + PERM[o2[2] + K]]] % 12;
        g[3] = PERM[I + 1 + PERM[J + 1 + PERM[K + 1]]] % 12;

        for (c = 0; c <= 3; c++) {
            f[c] = 0.6 - pos[c][0] * pos[c][0] - pos[c][1] * pos[c][1] -
            pos[c][2] * pos[c][2];
        }

        for (c = 0; c <= 3; c++) {
            if (f[c] > 0) {
                noise[c] = f[c] * f[c] * f[c] * f[c] *
                    Perlin.DOT3(pos[c], GRAD3[g[c]]);
            }
        }

        return (noise[0] + noise[1] + noise[2] + noise[3]) * 32.0;
    }

    static simplex2(handle, x, y, octaves, persistence, lacunarity)
        // [], float, float, int, float, float
    {
        let freq = 1.;
        let amp = 1.;
        let max = 1.;
        let total = Perlin.noise2(handle, x, y);
        for (let i = 1; i < octaves; i++) {
            freq *= lacunarity;
            amp *= persistence;
            max += amp;
            total += Perlin.noise2(handle, x * freq, y * freq) * amp;
        }

        return (1 + total / max) / 2;
    }

    static simplex3(handle, x, y, z, octaves, persistence, lacunarity)
        // [], float, float, int, float, float
    {
        let freq = 1.;
        let amp = 1.;
        let max = 1.;
        let total = Perlin.noise3(handle, x, y, z);
        for (let i = 1; i < octaves; ++i) {
            freq *= lacunarity;
            amp *= persistence;
            max += amp;
            total += Perlin.noise3(handle, x * freq, y * freq, z * freq) * amp;
        }
        return (1 + total / max) / 2;
    }

    static perlinGeneration(chunk, arg) { // int, int, ...
        const CHUNK_SIZE_X = chunk.dimensions[0];
        const CHUNK_SIZE_Y = chunk.dimensions[1]; // TODO see algo, diff.
        const CHUNK_SIZE_Z = chunk.dimensions[2];
        const SHOW_CLOUDS = true;
        const SHOW_TREES = true;
        const SHOW_PLANTS = true;

        const p = chunk.chunkI;
        const q = chunk.chunkJ;
        const handle = chunk.manager.handle;

        let blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
        Perlin.seed(handle, 'SEEED');
        let func = (x, y, z, w, arg) => {
            //console.log('posed ' + x+','+y+','+z+' ' +w);
            blocks[chunk._toId(x, y, z)] = w;

        };

        for (let dx = 0; dx < CHUNK_SIZE_X; dx++) {
            for (let dy = 0; dy < CHUNK_SIZE_Y; dy++) {
                let flag = 1;
                if (dx < 0 || dy < 0 || dx >= CHUNK_SIZE_X || dy >= CHUNK_SIZE_Y) {
                    flag = -1;
                }

                let x = p * CHUNK_SIZE_X + dx; // int
                let y = q * CHUNK_SIZE_Y + dy; // int
                let f = Perlin.simplex2(handle, x * 0.01, y * 0.01, 4, 0.5, 2); // float
                let g = Perlin.simplex2(handle, -x * 0.01, -y * 0.01, 2, 0.9, 2); // float
                let mh = g * 32 + 16; // int
                let h = parseInt(f * mh); // int
                let w = 1; // int
                let t = 12; // int
                if (h <= t) {
                    h = t;
                    w = 2;
                }

                // Sand and grass.
                for (let z = 0; z < h; z++) {
                    func(x, y, z, w * flag, arg);
                }

                if (w == 1) {
                    if (SHOW_PLANTS) {

                        // grass
                        if (Perlin.simplex2(handle, -x * 0.1, y * 0.1, 4, 0.8, 2) > 0.6) {
                            if (Math.floor(h)!=h) console.log('grass');
                            func(x, y, h, 17 * flag, arg);
                        }

                        // flowers
                        if (Perlin.simplex2(handle, x * 0.05, -y * 0.05, 4, 0.8, 2) > 0.7) {
                            let ww = 18 + Perlin.simplex2(handle, x * 0.1, y * 0.1, 4, 0.8, 2) * 7;
                            func(x, y, h, ww * flag, arg);
                        }
                    }

                    // Trees.
                    let ok = SHOW_TREES;
                    if (dx - 4 < 0 || dy - 4 < 0 ||
                        dx + 4 >= CHUNK_SIZE_X || dy + 4 >= CHUNK_SIZE_Y)
                    {
                        ok = 0;
                    }
                    if (ok && Perlin.simplex2(handle, x, y, 6, 0.5, 2) > 0.84) {
                        for (let z = h + 3; z < h + 8; z++) {
                            for (let ox = -3; ox <= 3; ox++) {
                                for (let oy = -3; oy <= 3; oy++) {
                                    let d = (ox * ox) + (oy * oy) +
                                        (z - (h + 4)) * (z - (h + 4));
                                    if (d < 11) {
                                        func(x + ox, y + oy, z, 15, arg);
                                    }
                                }
                            }
                        }
                        for (let z = h; z < h + 7; z++) {
                            func(x, y, z, 5, arg);
                        }
                    }
                }

                // Clouds.
                if (SHOW_CLOUDS) {
                    for (let z = 64; z < 72; z++) {
                        if (Perlin.simplex3(handle,
                                x * 0.01, y * 0.01, z * 0.1, 8, 0.5, 2) > 0.75)
                        {
                            func(x, y, z, 16 * flag, arg);
                        }
                    }
                }
            }
        }

        chunk.blocks = blocks;
    }

}

export default Perlin;
