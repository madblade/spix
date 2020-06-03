
'use strict';

import max from './max.js';
import min from './min.js';
import quickselect from './quickselect.js';
import number from './number.js';

export default function quantile(values, p)
{
    let n;
    if (!(n = values.length)) return;
    if ((p = +p) <= 0 || n < 2) return min(values);
    if (p >= 1) return max(values);
    const i = (n - 1) * p;
    const i0 = Math.floor(i);
    const value0 = max(quickselect(values, i0).subarray(0, i0 + 1));
    const value1 = min(values.subarray(i0 + 1));
    return value0 + (value1 - value0) * (i - i0);
}

export function quantileSorted(values, p, valueof = number)
{
    let n;
    if (!(n = values.length)) return;
    if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
    if (p >= 1) return +valueof(values[n - 1], n - 1, values);
    const i = (n - 1) * p;
    const i0 = Math.floor(i);
    const value0 = +valueof(values[i0], i0, values);
    const value1 = +valueof(values[i0 + 1], i0 + 1, values);
    return value0 + (value1 - value0) * (i - i0);
}
