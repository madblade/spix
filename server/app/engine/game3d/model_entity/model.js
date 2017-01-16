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
        // TODO [MEDIUM] accessor: LACKS.
        this._entities = new Map();
    }

    get entities() { return this._entities; }

    forEach(callback) {
        let entities = this._entities;
        entities.forEach((entity, id) => {
            callback(entity);
        });
    }

    spawnPlayer(p) {
        let entities = this._entities;
        let worldModel = this._game.worldModel;
        let id = CollectionUtil.generateId(entities);
        p.avatar = EntityFactory.createAvatar(id, this);

        // TODO [MEDIUM] custom spawn world and location.
        let world = worldModel.getWorld();
        p.avatar.spawn(world.getFreePosition(), world.worldId);

        entities.set(id, p.avatar);
    }

    removePlayer(playerId) {
        this._entities.delete(playerId);
    }

    // TODO [MEDIUM] optimize with LACKS structure.
    anEntityIsPresentOn(x, y, z) {
        let entities = this._entities;
        let result = false;
        entities.forEach((entity, id) => {
            let p = entity.position;
            if (p[0] >= x && p[0] <= x+1 && p[1] >= y && p[1] <= y+1 && p[2] >= z && p[2] <= z+1)
                result = true;
        });

        return result;
    }
}

export default EntityModel;
