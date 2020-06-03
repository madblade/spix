
'use strict';

export default function max(values, valueof)
{
    let maximum;
    if (valueof === undefined) {
        for (const value of values) {
            if (value !== null &&
                // eslint-disable-next-line no-self-compare
                (maximum < value || maximum === undefined && value >= value))
            {
                maximum = value;
            }
        }
    } else {
        let index = -1;
        for (let value of values) {
            if ((value = valueof(value, ++index, values)) !== null &&
                // eslint-disable-next-line no-self-compare
                (maximum < value || maximum === undefined && value >= value))
            {
                maximum = value;
            }
        }
    }
    return maximum;
}
