
'use strict';

export default function min(values, valueof)
{
    let minimum;
    if (valueof === undefined) {
        for (const value of values) {
            if (value !== null &&
                // eslint-disable-next-line no-self-compare
                (minimum > value || minimum === undefined && value >= value))
            {
                minimum = value;
            }
        }
    } else {
        let index = -1;
        for (let value of values) {
            if ((value = valueof(value, ++index, values)) !== null &&
                // eslint-disable-next-line no-self-compare
                (minimum > value || minimum === undefined && value >= value))
            {
                minimum = value;
            }
        }
    }
    return minimum;
}
