/**
 *
 */

'use strict';

class NumberUtils {

    static isEpsilon(strictlyPositiveNumber) {
        return (strictlyPositiveNumber < 0.000001);
    }

}

export default NumberUtils;
