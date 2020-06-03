
'use strict';

let Random = function(textSeed)
{
    function xmur3(str)
    {
        for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = h << 13 | h >>> 19;
        }
        return function() {
            h = Math.imul(h ^ h >>> 16, 2246822507);
            h = Math.imul(h ^ h >>> 13, 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
    }

    function sfc32(a, b, c, d)
    {
        return function() {
            a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
            let t = a + b | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = c << 21 | c >>> 11;
            d = d + 1 | 0;
            t = t + d | 0;
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        };
    }

    let seed1 = xmur3(`${textSeed}h2g2`);
    let seed2 = xmur3(`${textSeed}DouglasAdams`);
    let seed3 = xmur3(`${textSeed}42`);
    let rand1 = sfc32(seed1(), seed1(), seed1(), seed1());
    let rand2 = sfc32(seed2(), seed2(), seed2(), seed2());
    let rand3 = sfc32(seed3(), seed3(), seed3(), seed3());

    /**
     * Uniform distribution generator.
     * @returns uniform number in [0, 1]
     */
    this.uniform = function() {
        return rand1();
    };
    this.random = this.uniform; // alias for simplex generator

    /**
     * Normal distribution generator.
     * @returns number number in [-1, 1] (mean 0)
     */
    this.normal = function()
    {
        let u = 0; let v = 0;
        while (u === 0) u = rand2();
        while (v === 0) v = rand3();
        let n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        n = n / 10.0 + 0.5;
        if (n > 1 || n < 0) return this.normal();
        return n * 2 - 1;
    };

    // this.rnorm = this.normal;
    this.z2 = null;
    this.rnorm = function()
    {
        if (this.z2 !== null) {
            let tmp = this.z2;
            this.z2 = null;
            return tmp;
        }
        let x1 = 0;
        let x2 = 0;
        let w = 2.0;
        while (w >= 1)
        {
            x1 = this.uniform() * 2 - 1; // runif(-1, 1);
            x2 = this.uniform() * 2 - 1; // runif(-1, 1);
            w = x1 * x1 + x2 * x2;
        }
        w = Math.sqrt(-2 * Math.log(w) / w);
        this.z2 = x2 * w;
        return x1 * w;
    };

    this.clamp = function(n, min, max) {
        return Math.min(Math.max(n, min), max);
    };
};

let Sobol = function(dimension)
{
    let BITS = 52;
    let SCALE = 1048576; // 2 << 51;
    let COEFFICIENTS = [
        'd       s       a       m_i',
        '2       1       0       1',
        '3       2       1       1 3',
        '4       3       1       1 3 1',
        '5       3       2       1 1 1',
        '6       4       1       1 1 3 3',
        '7       4       4       1 3 5 13',
        '8       5       2       1 1 5 5 17',
        '9       5       4       1 1 5 5 5',
        '10      5       7       1 1 7 11 1'
    ];

    if (dimension < 1 || dimension > COEFFICIENTS.length) throw new Error('OOB');
    let tmp = [];
    let direction = [];
    let zee = [];
    let x = [];
    let lines = COEFFICIENTS;
    let count = 0;
    let i;

    this.dimension = dimension;
    this.count = count;

    this.next = function() {
        if (count === 0) {
            count++;
            return zee.slice();
        }
        let v = [];
        let c = 1;
        let value = count - 1;
        while ((value & 1) === 1) {
            value >>= 1;
            c++;
        }
        for (i = 0; i < dimension; i++) {
            x[i] ^= direction[i][c];
            v[i] = x[i] / SCALE;
        }
        count++;
        return v;
    };

    for (i = 0; i <= BITS; i++) tmp.push(0);
    for (i = 0; i < dimension; i++)
    {
        direction[i] = tmp.slice();
        x[i] = 0;
        zee[i] = 0;
    }

    for (i = 1; i <= BITS; i++) direction[0][i] = 1 << BITS - i;
    for (let d = 1; d < dimension; d++)
    {
        let cells = lines[d].split(/\s+/);
        let s = +cells[1];
        let a = +cells[2];
        let m = [0];
        for (i = 0; i < s; i++) m.push(+cells[3 + i]);
        for (i = 1; i <= s; i++) direction[d][i] = m[i] << BITS - i;
        for (i = s + 1; i <= BITS; i++) {
            direction[d][i] = direction[d][i - s] ^ direction[d][i - s] >> s;
            for (let k = 1; k <= s - 1; k++)
                direction[d][i] ^= (a >> s - 1 - k & 1) * direction[d][i - k];
        }
    }

    // Skip first trivial sieving
    this.rng = new Random('Sobol');
    let nbToSkip = Math.floor(10 + dimension * 10 * this.rng.uniform());

    for (let j = 0; j < nbToSkip; ++j) this.next();
    this.generate = function(num) {
        let draws = [];
        for (let j = 0; j < num; ++j) draws.push(this.next());
        return draws;
    };
};

export { Random, Sobol };
