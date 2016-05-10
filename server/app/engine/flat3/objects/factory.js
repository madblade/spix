/**
 *
 */

'use strict';

import Avatar from './avatar';
import Chunk from './chunk';

class ObjectFactory {

    static createAvatar(id) {
        return new Avatar(id);
    }

    static createChunk() {
        return new Chunk();
    }

}

export default ObjectFactory;
