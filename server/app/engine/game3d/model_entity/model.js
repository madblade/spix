/**
 *
 */

'use strict';

import Avatar from './avatar';
import Cube   from './cube';
import Walker from './walker';
import Projectile from './projectile';
// import Entity from './entity';
// import CollectionUtil from '../../math/collections';

class EntityModel
{
    constructor(game)
    {
        this._game = game;

        // Fast register for all entities.
        // [OPT] accessor: LACKS.
        // [OPT] use arrays
        //this._entities = new Map();
        // [OPT] cache optimization.
        this._entities = []; // Entity id <-> position in entity array.
        // new Array(10);
        this._freedEntities = []; // Indexes of deleted entities.
        this._entitiesLength = 0; // Length of entity array.
    }

    get entities() { return this._entities; }

    forEach(callback)
    {
        let entities = this._entities;
        entities.forEach(entity/*, id)*/ => {
            callback(entity);
        });
    }

    spawnPlayer(p, world, freePosition)
    {
        let avatar = this.createEntity('avatar');
        p.avatar = avatar;

        let worldId = world.worldId;
        avatar.spawn(freePosition, worldId);
    }

    spawnEntity(kind, world, position)
    {
        let entity = this.createEntity(kind);
        let worldId = world.worldId;
        entity.spawn(position, worldId);
        return entity;
    }

    // World to be set at spawn time.
    createEntity(kind)
    {
        let entities = this._entities;
        //let entitiesLength = this._entitiesLength;
        let freedEntities = this._freedEntities;

        let entityId;
        if (freedEntities.length > 0) {
            entityId = freedEntities[0];
            // ^ TODO [ENTITIES] impact consistency model
            freedEntities.shift();
        } else {
            entityId = entities.length;
            //if (entityId >= entitiesLength) resizeAugment();
            //++entitiesLength;
        }
        // console.log('Entity shall have id ' + entityId);

        let e;
        switch (kind) {
            case 'avatar':
                e = new Avatar(entityId);
                break;
            case 'cube':
                e = new Cube(entityId);
                break;
            case 'walker':
                e = new Walker(entityId);
                break;
            case 'projectile':
                e = new Projectile(entityId);
                break;
            default:
                throw Error('Invalid entity type.');
        }

        entities[entityId] = e;
        return e;
    }

    removePlayer(playerId)
    {
        this.removeEntity(playerId);
    }

    removeEntity(entityId)
    {
        this._entities[entityId] = undefined;
        this._freedEntities.push(entityId);
    }

    // [OPT] Can be optimized
    anEntityIsPresentOn(worldId, x, y, z)
    {
        let entities = this._entities;
        if (!entities) return false;
        // O(n) -> not good
        for (let e = 0, l = entities.length; e < l; ++e)
        {
            const entity = entities[e];
            if (!entity || entity.worldId !== worldId) continue;
            let p = entity.position;
            const px = p[0]; const wx = entity.widthX;
            const py = p[1]; const wy = entity.widthY;
            const pz = p[2]; const wz = entity.widthZ;
            if (x + 1 >= px - wx && x <= px + wx &&
               y + 1 >= py - wy && y <= py + wy &&
               z + 1 >= pz - wz && z <= pz + wz) return true;
        }

        return false;
    }
}

export default EntityModel;
