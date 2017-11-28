/**
 *
 */

'use strict';

import Entity from '../../../model_entity/entity';
import Portal from '../../../model_x/portal';

class ObjectOrderer {

    constructor(entityModel, xModel)
    {
        // Model.
        this._entityModel   = entityModel;
        this._xModel        = xModel;

        // Internals.
        this._axes = new Map(); // world id -> [ [{k,v,i}]x, []y, []z ]

        // this._islands = []; // 1 island: [entity/x id, ...]
        // this._isEntity = []; // 1 island: [is entity or x]
    }

    get axes()  { return this._axes; }

    static dichotomyLowerBound(a, value, prop) {
        let lo = 0; let hi = a.length - 1; let mid;
        while (lo <= hi) {
            mid = lo + hi >> 1; // floor((lo+hi)/2)
            // priority '+' > priority '>>'
            if (a[mid][prop] > value) hi = mid - 1;
            else if (a[mid][prop] < value) lo = mid + 1;
            else return mid;
        }
        return lo;
    }

    // Impact entities cached indices.
    // Each entity knows its position in axis arrays.
    static orderCache(array, entities, portals, start, prop) {
        for (let i = start, l = array.length; i < l; ++i) {
            const id = parseInt(array[i].id, 10);
            if (array[i].kind === 'e')
                entities[id][prop] = i;    // Array.
            else if (array[i].kind === 'x')
                portals.get(id)[prop] = i; // Map.
        }
    }

    // Compute sorted axes from scratch entity arrays.
    // Xs are taken into account to achieve efficient physics.
        // N.B. Chunk caches and specific x storage has nothing
        // to do with physics specifically.
        // Disclaimer: inefficient, but done at startup.
    orderObjects()
    {
        let portals = this._xModel.portals;
        let entities = this._entityModel.entities;
        let axes = this._axes;

        let orderCache = ObjectOrderer.orderCache;

        // Fill axes with entities.
        for (let i = 0, l = entities.length; i < l; ++i) {
            if (!entities) continue;
            let e = entities[i]; let wid = e.worldId; let p = e.p0;
            let axis = axes.get(wid); // Most inefficient call.

            if (!axis)
                axes.set(wid, [
                    [{kind: 'e', id: i, val:p[0]}],
                    [{kind: 'e', id: i, val:p[1]}],
                    [{kind: 'e', id: i, val:p[2]}]
                ]);
            else {
                axis[0].push({kind: 'e', id: i, val:p[0]});
                axis[1].push({kind: 'e', id: i, val:p[1]});
                axis[2].push({kind: 'e', id: i, val:p[2]});
            }
        }

        // TODO [CRIT] Fill axes with portals.
        portals.forEach((portal, i) => {
            let wid = portal.worldId; let p = portal.position;
            let axis = axes.get(wid); // Most inefficient call.

            if (!axis)
                axes.set(wid, [
                    [{kind: 'x', id: i, val:p[0]}],
                    [{kind: 'x', id: i, val:p[1]}],
                    [{kind: 'x', id: i, val:p[2]}]
                ]);
            else {
                axis[0].push({kind: 'x', id: i, val:p[0]});
                axis[1].push({kind: 'x', id: i, val:p[1]});
                axis[2].push({kind: 'x', id: i, val:p[2]});
            }
        });

        // Order axes.
        axes.forEach(xyzEntities/*, wid)*/ => {
            let xAxis = xyzEntities[0];
            let yAxis = xyzEntities[1];
            let zAxis = xyzEntities[2];

            if (!xAxis || !yAxis || !zAxis ||
                xAxis.length !== yAxis.length ||
                xAxis.length !== zAxis.length)
            {
                throw Error('[Physics/Orderer]: axis inconsistency.');
            }

            // Perform ordering.
            xAxis.sort((a, b) => a.val > b.val);
            yAxis.sort((a, b) => a.val > b.val);
            zAxis.sort((a, b) => a.val > b.val);

            // Write position in objects.
            // Using reflection.
            orderCache(xAxis, entities, portals, 0, 'indexX');
            orderCache(yAxis, entities, portals, 0, 'indexY');
            orderCache(zAxis, entities, portals, 0, 'indexZ');
        });
    }

    // [Thought] could be optimised by axis prealloc, dichotomy insertion,
    // keeping track of active elements, and realloc when necessary (gc).
    addObject(object) {
        let kind = object instanceof Entity ? 'e' :
            object instanceof Portal ? 'x' : null;
        if (!kind)
            throw Error('[Physics/Orderer]: invalid object kind.');

        // Get properties.
        let p = object.p0;
        let x = p[0]; let y = p[1]; let z = p[2];
        let eid = kind === 'e' ? object.entityId : object.portalId;

        let wid = object.worldId;
        let portals = this._xModel.portals;
        let entities = this._entityModel.entities;
        let axis = this._axes.get(wid);

        if (!axis) {
            this._axes.set(wid, [
                [{kind, id: eid, val: x}],
                [{kind, id: eid, val: y}],
                [{kind, id: eid, val: z}]
            ]);

            object.indexX = 0;
            object.indexY = 0;
            object.indexZ = 0;
        }

        else {
            let dichotomyLowerBound = ObjectOrderer.dichotomyLowerBound;
            let orderCache = ObjectOrderer.orderCache;
            let xAxis = axis[0];
            let yAxis = axis[1];
            let zAxis = axis[2];

            // Dichotomy search, insert after.
            let indexX = dichotomyLowerBound(xAxis, x, 'val');
            let indexY = dichotomyLowerBound(yAxis, y, 'val');
            let indexZ = dichotomyLowerBound(zAxis, z, 'val');
            if (!xAxis[indexX] && indexX !== xAxis.length) // Not found
                throw Error(`[Physics/Orderer]: element not found. ${indexX}`);

            while (xAxis[indexX] && xAxis[indexX].val <= x) ++indexX;
            xAxis.splice(indexX, 0, {kind, id: eid, val: x});

            while (yAxis[indexY] && yAxis[indexY].val <= y) ++indexY;
            yAxis.splice(indexY, 0, {kind, id: eid, val: y});

            while (zAxis[indexZ] && zAxis[indexZ].val <= z) ++indexZ;
            zAxis.splice(indexZ, 0, {kind, id: eid, val: z});

            // Reorder last entities.
            orderCache(xAxis, entities, portals, indexX, 'indexX');
            orderCache(yAxis, entities, portals, indexY, 'indexY');
            orderCache(zAxis, entities, portals, indexZ, 'indexZ');
        }
    }

    // TODO [HIGH] portals
    moveObject(object) {
        let kind = object instanceof Entity ? 'e' :
            object instanceof Portal ? 'x' : null;
        if (!kind)
            throw Error('[Physics/Orderer]: invalid object kind.');

        // Get properties.
        let p0 = object.p0;
        //let eid = kind === 'e' ? object.entityId : object.portalId;

        let wid = object.worldId;
        //let portals = this._xModel.portals;
        //let entities = this._entityModel.entities;
        let axis = this._axes.get(wid);

        let x = p0[0]; let y = p0[1]; let z = p0[2];
        let indexX = object.indexX;
        let indexY = object.indexY;
        let indexZ = object.indexZ;

        let axisX = axis[0];
        let axisY = axis[1];
        let axisZ = axis[2];

        axisX[indexX].val = x;
        axisY[indexY].val = y;
        axisZ[indexZ].val = z;
    }

    // [Thought] could be optimised by garbage collection.
    // Keeping a list of active objects for each axis.
    removeObject(object) {
        let kind = object instanceof Entity ? 'e' :
            object instanceof Portal ? 'x' : null;
        if (!kind)
            throw Error('[Physics/Orderer]: invalid object kind.');

        let portals = this._xModel.portals;
        let entities = this._entityModel.entities;
        let wid = object.worldId;
        let axis = this._axes.get(wid);
        let indexX = object.indexX;
        let indexY = object.indexY;
        let indexZ = object.indexZ;

        let xAxis = axis[0];
        let yAxis = axis[1];
        let zAxis = axis[2];

        xAxis.splice(indexX, 1);
        yAxis.splice(indexY, 1);
        zAxis.splice(indexZ, 1);

        // 1 shift -> O(n)
        if (xAxis.length > 0) {
            let orderCache = ObjectOrderer.orderCache;
            orderCache(xAxis, entities, portals, indexX, 'indexX');
            orderCache(yAxis, entities, portals, indexY, 'indexY');
            orderCache(zAxis, entities, portals, indexZ, 'indexZ');
        } else {
            this._axes.delete(wid);
        }
    }

    switchEntityToWorld(entity, newWorldId, coordinates)
    {
        let portals = this._xModel.portals;
        let entities = this._entityModel.entities;

        let oldWorldId = entity.worldId;
        let eid = entity.entityId;
        //entity.position = coordinates;

        let x = coordinates[0];
        let y = coordinates[1];
        let z = coordinates[2];
        let xid = entity.indexX;
        let yid = entity.indexY;
        let zid = entity.indexZ;

        // Old axes?
        let oldAxis = this._axes.get(oldWorldId);
        if (oldAxis) {
            // Remove from old set of axes.
            oldAxis[0].splice(xid, 1);
            oldAxis[1].splice(yid, 1);
            oldAxis[2].splice(zid, 1);
            if (oldAxis[0].length < 1) this._axes.delete(oldWorldId);
            else {
                let orderCache = ObjectOrderer.orderCache;
                orderCache(oldAxis[0], entities, portals, xid, 'indexX');
                orderCache(oldAxis[1], entities, portals, yid, 'indexY');
                orderCache(oldAxis[2], entities, portals, zid, 'indexZ');
            }
        } else console.log('ERROR');

        // Insert into new set of axes.
        let newAxis = this._axes.get(newWorldId);
        if (!newAxis) {
            this._axes.set(newWorldId, [
                [{kind:'e', id:eid, val:x}],
                [{kind:'e', id:eid, val:y}],
                [{kind:'e', id:eid, val:z}]
            ]);
            entity.indexX = 0;
            entity.indexY = 0;
            entity.indexZ = 0;
        }
        else {
            let xAxis = newAxis[0]; let xLow;
            let yAxis = newAxis[1]; let yLow;
            let zAxis = newAxis[2]; let zLow;

            let dichotomyLowerBound = ObjectOrderer.dichotomyLowerBound;

            xLow = dichotomyLowerBound(xAxis, x, 'val');
            yLow = dichotomyLowerBound(yAxis, y, 'val');
            zLow = dichotomyLowerBound(zAxis, z, 'val');

            if (xLow >= 0) xAxis.splice(xLow/* + 1*/, 0, {kind:'e', id:eid, val:x});
            if (yLow >= 0) yAxis.splice(yLow/* + 1*/, 0, {kind:'e', id:eid, val:y});
            if (zLow >= 0) zAxis.splice(zLow/* + 1*/, 0, {kind:'e', id:eid, val:z});

            // 1 shift -> O(n)
            let orderCache = ObjectOrderer.orderCache;
            orderCache(xAxis, entities, portals, xLow, 'indexX');
            orderCache(yAxis, entities, portals, yLow, 'indexY');
            orderCache(zAxis, entities, portals, zLow, 'indexZ');
        }

        // Set new world.
        entity.worldId = newWorldId;
    }

}

export default ObjectOrderer;
