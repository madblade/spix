/**
 *
 */

'use strict';

import ObjectFactory from './factory';

class ObjectManager {

    constructor() {
        this._chunks = [];
        this._blocks = [];
        this._entities = [];

        this._world = [this._chunks, this._blocks, this._entities];
    }

    update() {

    }

    spawnPlayer(p) {
        p.avatar = ObjectFactory.createAvatar();
        p.avatar.spawn();
        this._entities.push(p);
    }

    despawnPlayer(p) {
        p.avatar.die();
        delete p.avatar;
    }

}

export default ObjectManager;
