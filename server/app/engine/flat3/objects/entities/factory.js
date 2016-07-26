/**
 *
 */

'use strict';

import Avatar from './../entities/avatar';

class EntityFactory {

    static createAvatar(id, entityManager) {
        return new Avatar(id, entityManager);
    }

}

export default EntityFactory;
