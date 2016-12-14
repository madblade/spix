/**
 *
 */

'use strict';

import Avatar from './avatar';

class EntityFactory {

    static createAvatar(id, entityManager) {
        return new Avatar(id, entityManager);
    }

}

export default EntityFactory;
