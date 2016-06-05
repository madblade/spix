/**
 *
 */

'use strict';

import ObjectFactory from '../objects/world/factory';

class Generator {

    static generateFlatWorld() {
        return {
            '0,0': ObjectFactory.createChunk(),
            '0,-1': ObjectFactory.createChunk(),
            '-1,0': ObjectFactory.createChunk(),
            '-1,-1': ObjectFactory.createChunk()
        };
    }

    static generatePerlinWorld() {
        return {};
    }

}

export default Generator;
