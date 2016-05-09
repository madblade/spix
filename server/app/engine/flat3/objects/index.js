/**
 *
 */

'use strict';

import ObjectFactory from './factory';
import CollectionUtil from '../../../math/collections/util';

class ObjectManager {

    constructor() {
        this._chunks = [];
        this._blocks = [];
        this._entities = [];

        this._world = [this._chunks, this._blocks, this._entities];
    }

    update() {}

    spawnPlayer(p) {
        let id = CollectionUtil.generateId(this._entities);
        p.avatar = ObjectFactory.createAvatar(id);
        p.avatar.spawn();
        this._entities.push(p);
    }

    despawnPlayer(p) {
        p.avatar.die();
        CollectionUtil.removeFromArray(this._entities, p);
        delete p.avatar;
    }

}

export default ObjectManager;
