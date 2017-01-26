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

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var seedrandom = require('seedrandom');

var Perlin = function () {
    function Perlin() {
        (0, _classCallCheck3.default)(this, Perlin);
    }

    (0, _createClass3.default)(Perlin, null, [{
        key: 'getPerm',
        value: function getPerm(handle) {
            return Perlin._permMap[handle];
        }
    }, {
        key: 'setPerm',
        value: function setPerm(handle, permMap) {
            Perlin._permMap[handle] = permMap;
        }
    }, {
        key: 'seed',
        value: function seed(handle, x) {
            // unsigned int
            var PERM = Perlin.PERM();
            var RAND_MAX = 1.0;
            var rng = seedrandom(x);

            for (var i = 0; i < 256; i++) {
                PERM[i] = i;
            }
            for (var _i = 255; _i > 0; _i--) {
                var j = void 0;
                var n = _i + 1;
                while (n <= (j = Math.floor(rng() * n))) {}

                var a = PERM[_i];
                var b = PERM[j];
                PERM[_i] = b;
                PERM[j] = a;
            }

            for (var _i2 = 0; _i2 < 256; ++_i2) {
                PERM[_i2 + 256] = PERM[_i2];
            }

            Perlin.setPerm(handle, PERM);
        }
    }, {
        key: 'noise2',
        value: function noise2(handle, x, y) {
            // float, float, float
            var floorf = function floorf(x) {
                return parseInt(Math.floor(x));
            };
            var PERM = Perlin.getPerm(handle);
            var GRAD3 = Perlin.GRAD3();

            var i1 = void 0,
                j1 = void 0,
                I = void 0,
                J = void 0,
                c = void 0;
            var s = (x + y) * Perlin.F2;
            var i = floorf(x + s);
            var j = floorf(y + s);
            var t = (i + j) * Perlin.G2;

            var xx = [0., 0., 0.];
            var yy = [0., 0., 0.];
            var f = [0., 0., 0.];
            var noise = [0., 0., 0.];
            var g = [0., 0., 0.];

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
                f[c] = 0.5 - xx[c] * xx[c] - yy[c] * yy[c];
            }

            for (c = 0; c <= 2; c++) {
                if (f[c] > 0) {
                    noise[c] = f[c] * f[c] * f[c] * f[c] * (GRAD3[g[c]][0] * xx[c] + GRAD3[g[c]][1] * yy[c]);
                }
            }

            return (noise[0] + noise[1] + noise[2]) * 70.0;
        }
    }, {
        key: 'noise3',
        value: function noise3(handle, x, y, z) {
            var floorf = function floorf(x) {
                return parseInt(Math.floor(x));
            };
            var PERM = Perlin.getPerm(handle);
            var GRAD3 = Perlin.GRAD3();

            var c = void 0,
                o1 = [0, 0, 0],
                o2 = [0, 0, 0],
                g = [0, 0, 0, 0],
                I = void 0,
                J = void 0,
                K = void 0;
            var f = [0., 0., 0.],
                noise = [0., 0., 0., 0.];
            var s = (x + y + z) * Perlin.F3;
            var i = floorf(x + s);
            var j = floorf(y + s);
            var k = floorf(z + s);
            var t = (i + j + k) * Perlin.G3;

            var pos = [[0., 0., 0.], [0., 0., 0.], [0., 0., 0.], [0., 0., 0.]];

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
                f[c] = 0.6 - pos[c][0] * pos[c][0] - pos[c][1] * pos[c][1] - pos[c][2] * pos[c][2];
            }

            for (c = 0; c <= 3; c++) {
                if (f[c] > 0) {
                    noise[c] = f[c] * f[c] * f[c] * f[c] * Perlin.DOT3(pos[c], GRAD3[g[c]]);
                }
            }

            return (noise[0] + noise[1] + noise[2] + noise[3]) * 32.0;
        }
    }, {
        key: 'simplex2',
        value: function simplex2(handle, x, y, octaves, persistence, lacunarity)
        // [], float, float, int, float, float
        {
            var freq = 1.;
            var amp = 1.;
            var max = 1.;
            var total = Perlin.noise2(handle, x, y);
            for (var i = 1; i < octaves; i++) {
                freq *= lacunarity;
                amp *= persistence;
                max += amp;
                total += Perlin.noise2(handle, x * freq, y * freq) * amp;
            }

            return (1 + total / max) / 2;
        }
    }, {
        key: 'simplex3',
        value: function simplex3(handle, x, y, z, octaves, persistence, lacunarity)
        // [], float, float, int, float, float
        {
            var freq = 1.;
            var amp = 1.;
            var max = 1.;
            var total = Perlin.noise3(handle, x, y, z);
            for (var i = 1; i < octaves; ++i) {
                freq *= lacunarity;
                amp *= persistence;
                max += amp;
                total += Perlin.noise3(handle, x * freq, y * freq, z * freq) * amp;
            }
            return (1 + total / max) / 2;
        }
    }, {
        key: 'perlinGeneration',
        value: function perlinGeneration(chunk, arg) {
            // int, int, ...
            var CHUNK_SIZE_X = chunk.dimensions[0];
            var CHUNK_SIZE_Y = chunk.dimensions[1]; // TODO [LOW] see algo, diff.
            var CHUNK_SIZE_Z = chunk.dimensions[2];
            var SHOW_CLOUDS = true;
            var SHOW_TREES = true;
            var SHOW_PLANTS = true;

            var p = chunk.chunkI;
            var q = chunk.chunkJ;
            var handle = chunk.world.worldId;

            var blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
            Perlin.seed(handle, 'SEEED');
            var func = function func(x, y, z, w, arg) {
                //console.log('posed ' + x+','+y+','+z+' ' +w);
                blocks[chunk._toId(x, y, z)] = w;
            };

            for (var dx = 0; dx < CHUNK_SIZE_X; dx++) {
                for (var dy = 0; dy < CHUNK_SIZE_Y; dy++) {
                    var flag = 1;
                    if (dx < 0 || dy < 0 || dx >= CHUNK_SIZE_X || dy >= CHUNK_SIZE_Y) {
                        flag = -1;
                    }

                    var x = p * CHUNK_SIZE_X + dx; // int
                    var y = q * CHUNK_SIZE_Y + dy; // int
                    var f = Perlin.simplex2(handle, x * 0.01, y * 0.01, 4, 0.5, 2); // float
                    var g = Perlin.simplex2(handle, -x * 0.01, -y * 0.01, 2, 0.9, 2); // float
                    var mh = g * 32 + 16; // int
                    var h = parseInt(f * mh); // int
                    var w = 1; // int
                    var t = 12; // int
                    if (h <= t) {
                        h = t;
                        w = 2;
                    }

                    // Sand and grass.
                    for (var z = 0; z < h; z++) {
                        func(x, y, z, w * flag, arg);
                    }

                    if (w == 1) {
                        if (SHOW_PLANTS) {

                            // grass
                            if (Perlin.simplex2(handle, -x * 0.1, y * 0.1, 4, 0.8, 2) > 0.6) {
                                if (Math.floor(h) != h) console.log('grass');
                                func(x, y, h, 17 * flag, arg);
                            }

                            // flowers
                            if (Perlin.simplex2(handle, x * 0.05, -y * 0.05, 4, 0.8, 2) > 0.7) {
                                var ww = 18 + Perlin.simplex2(handle, x * 0.1, y * 0.1, 4, 0.8, 2) * 7;
                                func(x, y, h, ww * flag, arg);
                            }
                        }

                        // Trees.
                        var ok = SHOW_TREES;
                        if (dx - 4 < 0 || dy - 4 < 0 || dx + 4 >= CHUNK_SIZE_X || dy + 4 >= CHUNK_SIZE_Y) {
                            ok = 0;
                        }
                        if (ok && Perlin.simplex2(handle, x, y, 6, 0.5, 2) > 0.84) {
                            for (var _z = h + 3; _z < h + 8; _z++) {
                                for (var ox = -3; ox <= 3; ox++) {
                                    for (var oy = -3; oy <= 3; oy++) {
                                        var d = ox * ox + oy * oy + (_z - (h + 4)) * (_z - (h + 4));
                                        if (d < 11) {
                                            func(x + ox, y + oy, _z, 15, arg);
                                        }
                                    }
                                }
                            }
                            for (var _z2 = h; _z2 < h + 7; _z2++) {
                                func(x, y, _z2, 5, arg);
                            }
                        }
                    }

                    // Clouds.
                    if (SHOW_CLOUDS) {
                        for (var _z3 = 64; _z3 < 72; _z3++) {
                            if (Perlin.simplex3(handle, x * 0.01, y * 0.01, _z3 * 0.1, 8, 0.5, 2) > 0.75) {
                                func(x, y, _z3, 16 * flag, arg);
                            }
                        }
                    }
                }
            }

            chunk.blocks = blocks;
        }
    }]);
    return Perlin;
}();

Perlin.F2 = 0.3660254037844386;
Perlin.G2 = 0.21132486540518713;
Perlin.F3 = 1.0 / 3.0;
Perlin.G3 = 1.0 / 6.0;

Perlin.ASSIGN = function (a, v0, v1, v2) {
    a[0] = v0;a[1] = v1;a[2] = v2;
};

Perlin.DOT3 = function (v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};

Perlin.RAND_MAX = 1.0;

Perlin.GRAD3 = function () {
    return [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1], [1, 0, -1], [-1, 0, -1], [0, -1, 1], [0, 1, 1]];
};

Perlin.PERM = function () {
    return [// unsigned char
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180, 151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
};

Perlin._permMap = {};
exports.default = Perlin;
//# sourceMappingURL=generator_perlin.js.map
