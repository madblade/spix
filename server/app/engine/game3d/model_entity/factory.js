/**
 *
 */

'use strict';

import Avatar from './avatar';

class EntityFactory {

    static createAvatar(id, entityModel) {
        return new Avatar(id, entityModel);
    }

}

export default EntityFactory;
