/**
 *
 */

'use strict';

import Avatar from './avatar';
import Entity from './entity';
import CollectionUtil from '../../math/collections';

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
        entities.forEach((entity, id) => {
            callback(entity);
        });
    }

    spawnPlayer(p) {
        let avatar = this.createEntity('avatar');
        p.avatar = avatar;

        // TODO [MEDIUM] custom spawn world and location.
        let world = this._game.worldModel.getWorld();
        let worldId = world.worldId;
        avatar.spawn(world.getFreePosition(), worldId);

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
        switch(kind) {
            case 'avatar':
                e = new Avatar(entityId);
                break;
            case 'mob':
                e = new Entity(entityId);
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
        // TODO [CRIT] optimize with LACKS structure.
        let entities = this._entities;
        let result = false;
        if (!entities) return result;
        // O(n) -> not good -> REFACTOR QUIIICK
        entities.forEach(entity => {
            if (entity.worldId !== worldId) return;
            let p = entity.position;
            if (p[0] >= x && p[0] <= x+1 && p[1] >= y && p[1] <= y+1 && p[2] >= z && p[2] <= z+1)
                result = true;
        });

        return result;
    }

}

export default EntityModel;
