/**
 *
 */

'use strict';

import Avatar from './avatar';

class ObjectFactory {

    static createAvatar(id) {
        return new Avatar(id);
    }

}

export default ObjectFactory;
