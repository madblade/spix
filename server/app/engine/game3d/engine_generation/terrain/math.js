
'use strict';

// Math util functions

import quantile from './d3math/quantile';

let d3quantile = quantile;

function quantile2(mesh, q)
{
    let h = mesh.buffer;
    const hl = h.length;
    let sortedh = new Float64Array(hl);
    for (let i = 0; i < hl; i++) {
        sortedh[i] = h[i];
    }
    sortedh.sort(); // ascending
    return d3quantile(sortedh, q);
}

function mean(indexArray, array)
{
    let l = indexArray.length;
    let m = 0; let n = 0;
    for (let i = 0; i < l; ++i) {
        m += array[indexArray[i]];
        ++n;
    }
    return m / n;
}

function min(array)
{
    let m = Infinity;
    for (let i = 0, l = array.length, v; i < l; ++i)
    {
        if ((v = array[i]) < m) m = v;
    }
    return m;
}

function max(array)
{
    let m = -Infinity;
    for (let i = 0, l = array.length, v; i < l; ++i)
    {
        if ((v = array[i]) > m) m = v;
    }
    return m;
}

function maxArg(array)
{
    let m = -Infinity;
    let maxIndex = 0;
    for (let i = 1, l = array.length, v; i < l; ++i)
    {
        if ((v = array[i]) > m)
        {
            m = v;
            maxIndex = i;
        }
    }
    return maxIndex;
}

function minArg(array, compare)
{
    let minValue = Infinity;
    let minIndex = 0;
    for (let i = 1, l = array.length, value; i < l; ++i)
    {
        value = array[i];
        if (
            minIndex === 0 ?
                compare(value, value) === 0                :
                compare(value, minValue) < 0
        )
        {
            minValue = value;
            minIndex = i;
        }
    }

    return minIndex;
}

export {
    min, max, maxArg, minArg,
    mean,
    quantile2
};
