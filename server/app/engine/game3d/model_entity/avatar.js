/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity {

    constructor(id, entityModel) {
        super(id);
        this._entityModel = entityModel;

        this._kind = 'player';
        this._renderDistance = 8;
        this._role = 0;
    }

    /**
     * @returns
     *  -1: admin
     *  0: OP
     *  1: registered
     *  2: guest
     */
    get role() { return this._role; }
    get renderDistance() { return this._renderDistance; }
    get entityModel() { return this._entityModel; }

    set role(role) { this._role = role; }
    set renderDistance(renderDistance) { this._renderDistance = renderDistance; }
}

export default Avatar;
