/**
 *
 */

'use strict';

import Avatar from './avatar';
import Cube   from './cube';
// import Entity from './entity';
// import CollectionUtil from '../../math/collections';

class EntityModel {

    constructor(game) {
        this._game = game;

        // Fast register for all entities.
        // TODO [CRIT] accessor: LACKS.
        // TODO [CRIT] use arrays
        //this._entities = new Map();
        // TODO [CRIT] cache optimization.
        this._entities = []; // Entity id <-> position in entity array.
        // new Array(10);
        this._freedEntities = []; // Indexes of deleted entities.
        this._entitiesLength = 0; // Length of entity array.
    }

    get entities() { return this._entities; }

    forEach(callback) {
        let entities = this._entities;
        entities.forEach(entity/*, id)*/ => {
            callback(entity);
        });
    }

    spawnPlayer(p, world, freePosition) {
        let avatar = this.createEntity('avatar');
        p.avatar = avatar;

        let worldId = world.worldId;
        avatar.spawn(freePosition, worldId);
    }

    // World to be set at spawn time.
    createEntity(kind) {
        let entities = this._entities;
        //let entitiesLength = this._entitiesLength;
        let freedEntities = this._freedEntities;

        let entityId;
        if (freedEntities.length > 0) {
            entityId = freedEntities[0];
            freedEntities.shift();
        } else {
            entityId = entities.length;
            //if (entityId >= entitiesLength) resizeAugment();
            //++entitiesLength;
        }
        // console.log('Entity shall have id ' + entityId);

        var e;
        switch (kind) {
            case 'avatar':
                e = new Avatar(entityId);
                break;
            case 'cube':
                e = new Cube(entityId);
                break;
            default:
                throw Error('Invalid entity type.');
        }

        entities[entityId] = e;
        return e;
    }

    removePlayer(playerId) {
        this.removeEntity(playerId);
    }

    removeEntity(entityId) {
        this._entities[entityId] = undefined;
        this._freedEntities.push(entityId);
    }

    anEntityIsPresentOn(worldId, x, y, z) {
        // TODO [HIGH] optimize with chunks structure.
        let entities = this._entities;
        let result = false;
        if (!entities) return result;
        // O(n) -> not good -> REFACTOR QUIIICK
        entities.forEach(entity => {
            if (!entity || entity.worldId !== worldId) return;
            // TODO [HIGH] use width
            let p = entity.position;
            if (p[0] >= x && p[0] <= x + 1 && p[1] >= y && p[1] <= y + 1 && p[2] >= z && p[2] <= z + 1)
                result = true;
        });

        return result;
    }

}

export default EntityModel;
