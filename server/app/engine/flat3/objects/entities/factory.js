/**
 *
 */

'use strict';

import Avatar from './../entities/avatar';

class EntityFactory {

    static createAvatar(id) {
        return new Avatar(id);
    }

}

export default EntityFactory;
