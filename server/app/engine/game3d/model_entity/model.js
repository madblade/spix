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

        // Keep track of modified objects.
        //this._updatedEntities = {};
    }

    get entities() { return this._entities; }

    //get updatedEntities() {
    //    return this._updatedEntities;
    //}

    forEach(callback) {
        let entities = this._entities;
        for (let entityId in entities) {
            callback(entities[entityId]);
        }
    }

    //extractEntitiesInRange(player) {
    //    var entities = [];
    //    for (var eid in this._entities) {
    //        if (this._entities[eid]._id === player.avatar._id) continue;
    //
    //        let entity = this._entities[eid];
    //        entities.push({p:entity.position, r:entity.rotation, k:entity.kind});
    //    }
    //    return entities;
    //}

    // TODO cleanup
    //updateEntitiesTransmitted() {
    //    this._updatedEntities = {};
    //}

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

    //entityUpdated(entityId) {
    //    this._updatedEntities[entityId] = true;
    //}

    // TODO optimize with LACKS structure.
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
