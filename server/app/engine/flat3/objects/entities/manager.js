/**
 *
 */

'use strict';

import EntityFactory from './factory';
import CollectionUtil from '../../../../math/collections/util';

class EntityManager {

    constructor(worldManager) {
        this._worldManager = worldManager;

        // Objects.
        this._entities = {};

        // Keep track of modified objects.
        this._updatedEntities = {};
    }

    update() {
        // Update entities.
    }

    get updatedEntities() {
        return this._updatedEntities;
    }

    // TODO manage disappearances
    extractEntitiesInRange(player) {
        var entities = [];
        for (var eid in this._entities) {
            if (!this._entities.hasOwnProperty(eid)) continue;
            if (this._entities[eid]._id === player.avatar._id) continue;
            entities.push(this._entities[eid]);
        }
        return entities;
    }

    updateEntitiesTransmitted() {
        this._updatedEntities = {};
    }

    spawnPlayer(p) {
        let id = CollectionUtil.generateId(this._entities);
        p.avatar = EntityFactory.createAvatar(id);
        p.avatar.spawn(this._worldManager.getFreePosition());
        this._entities[id] = p.avatar;
    }

    despawnPlayer(p) {
        p.avatar.die();
        delete this._entities[p.avatar.id];
        delete p.avatar;
    }

    entityUpdated(entityId) {
        // var p = this._entities[entityId].position;
        // console.log(p[0] + " " + p[1] + " " + p[2]);
        this._updatedEntities[entityId] = true;
    }

}

export default EntityManager;
