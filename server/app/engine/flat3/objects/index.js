/**
 *
 */

'use strict';

import ObjectFactory from './factory';
import CollectionUtil from '../../../math/collections/util';
import Generator from '../ai/generator';

class ObjectManager {

    constructor() {
        this._world = Generator.generateFlatWorld();

        this._chunks = this._world[0];
        this._blocks = this._world[1];
        this._entities = this._world[2];
    }

    get world() { return this._world; }

    update() {}

    spawnPlayer(p) {
        let id = CollectionUtil.generateId(this._entities);
        p.avatar = ObjectFactory.createAvatar(id);
        p.avatar.spawn();
        this._entities.push(p.avatar);
    }

    despawnPlayer(p) {
        p.avatar.die();
        CollectionUtil.removeFromArray(this._entities, p.avatar);
        delete p.avatar;
    }

}

export default ObjectManager;
