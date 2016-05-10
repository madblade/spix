/**
 *
 */

'use strict';

import ObjectFactory from '../objects/factory';

class Generator {

    static generateFlatWorld() {
        return {
            '0x0': ObjectFactory.createChunk(),
            '0x-1': ObjectFactory.createChunk(),
            '-1x0': ObjectFactory.createChunk(),
            '-1x-1': ObjectFactory.createChunk()
        };
    }

    static generatePerlinWorld() {
        return {};
    }

}

export default Generator;
