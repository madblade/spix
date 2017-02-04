/**
 *
 */

'use strict';

import EntityFactory from './factory';
import CollectionUtil from '../../math/collections';

class EntityModel {

    constructor(game) {
        this._game = game;

        // Fast register for all entities.
        // TODO [MEDIUM] accessor: LACKS.
        this._entities = new Map();

        // Entity registers are duplicated and refined here.
        // An entity can be present in distinct worlds.
        this._worldEntities = new Map();
    }

    get entities() { return this._entities; }
    get worldEntities() { return this._worldEntities; }

    forEach(callback) {
        let entities = this._entities;
        entities.forEach((entity, id) => {
            callback(entity);
        });
    }

    spawnPlayer(p) {
        let entities = this._entities;
        let worldModel = this._game.worldModel;
        let playerId = CollectionUtil.generateId(entities);
        p.avatar = EntityFactory.createAvatar(playerId, this);
        let avatar = p.avatar;

        // TODO [MEDIUM] custom spawn world and location.
        let world = worldModel.getWorld();
        let worldId = world.worldId;
        avatar.spawn(world.getFreePosition(), worldId);

        let worldEntities = this._worldEntities.get(worldId);
        if (!worldEntities) {
            worldEntities = new Map();
            worldEntities.set(playerId, avatar);
            this._worldEntities.set(worldId, worldEntities);
        } else {
            worldEntities.set(playerId, avatar);
        }
        entities.set(playerId, avatar);
    }

    removePlayer(playerId) {
        let worldEntities = this._worldEntities;
        let entity = this._entities.get(playerId);
        let worldId = entity.worldId;
        let otherStates = entity.otherStates;

        otherStates.forEach((state, wid) => worldEntities.get(wid).delete(playerId));
        this._worldEntities.get(worldId).delete(playerId);
        this._entities.delete(playerId);
    }

    anEntityIsPresentOn(worldId, x, y, z) {
        //let entities = this._entities;
        // TODO [MEDIUM] optimize with LACKS structure.
        let entities = this._worldEntities.get(worldId);
        let result = false;
        entities.forEach((entity, id) => {
            let p = entity.position;
            if (p[0] >= x && p[0] <= x+1 && p[1] >= y && p[1] <= y+1 && p[2] >= z && p[2] <= z+1)
                result = true;
        });

        return result;
    }

    appearInWorld(worldId, entityId) {
        // All entities are kept in a global register.
        let currentEntity = this._entities.get(entityId);
        let entitiesInWorld = this._worldEntities.get(worldId);

        if (!entitiesInWorld) {
            entitiesInWorld = new Map();
            entitiesInWorld.set(entityId, currentEntity);
            this._worldEntities.set(worldId, entitiesInWorld);
        } else {
            entitiesInWorld.set(entityId, currentEntity);
        }
    }

    disappearFromWorld(worldId, entityId) {
        let entitiesInWorld = this._worldEntities.get(worldId);
        if (!entitiesInWorld) return;
        entitiesInWorld.delete(entityId);
    }

}

export default EntityModel;
