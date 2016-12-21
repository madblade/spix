/**
 *
 */

'use strict';

import EntityFactory from './factory';
import CollectionUtil from '../../math/collections';

class EntityModel {

    constructor(game) {
        this._game = game;

        // Objects.
        this._entities = {};
        // TODO [CRIT] put in a Map.
    }

    get entities() { return this._entities; }

    forEach(callback) {
        let entities = this._entities;
        for (let entityId in entities) {
            callback(entities[entityId]);
        }
    }

    spawnPlayer(p) {
        let id = CollectionUtil.generateId(this._entities);
        p.avatar = EntityFactory.createAvatar(id, this);
        p.avatar.spawn(this._game.worldModel.getFreePosition());
        this._entities[id] = p.avatar;
    }

    despawnPlayer(p) {
        p.avatar.die();
        delete this._entities[p.avatar.id];
        delete p.avatar;
    }

    // TODO [MEDIUM] optimize with LACKS structure.
    anEntityIsPresentOn(x, y, z) {
        let entities = this._entities;
        for (let entityId in entities) {
            let p = entities[entityId].position;
            if (p[0] >= x && p[0] <= x+1 && p[1] >= y && p[1] <= y+1 && p[2] >= z && p[2] <= z+1)
                return true;
        }
        return false;
    }
}

export default EntityModel;
