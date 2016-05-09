/**
 *
 */

'use strict';

import Avatar from './avatar';

class ObjectFactory {

    static createAvatar() {
        return new Avatar();
    }

}

export default ObjectFactory;
