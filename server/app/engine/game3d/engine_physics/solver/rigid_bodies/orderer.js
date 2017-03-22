/**
 *
 */

'use strict';

import Entity from '../../../model_entity/entity';
import Portal from '../../../model_x/portal';

class Orderer {
    
    constructor(entityModel, xModel) {
        
        // Model.
        this._entityModel   = entityModel;
        this._xModel        = xModel;
        
        // Internals.
        this._xAxis = new Map();
        this._yAxis = new Map();
        this._zAxis = new Map();
        
    }

    get xAxis() { return this._xAxis; }
    get yAxis() { return this._yAxis; }
    get zAxis() { return this._zAxis; }
    
    static dichotomyLowerBound(a, value, prop) {
        var lo = 0, hi = a.length - 1, mid;
        while (lo <= hi) {
            mid = (lo + hi) >> 1; // floor((lo+hi)/2)
            if (a[mid][prop] > value) hi = mid - 1;
            else if (a[mid][prop] < value) lo = mid + 1;
            else return mid;
        }
        return lo;
    };


    // Impact entities cached indices.
    // Each entity knows its position in axis arrays.
    static orderCache(array, entities, portals, start, prop) {
        for (let i = start, l = array.length; i < l; ++i)
            if (array[i].kind === 'e')
                entities.get(array[i].id)[prop] = i;
            else if (array[i].kind === 'x')
                portals.get(array[i].id)[prop] = i;
    };
    
    // Compute sorted axes from scratch or from partial (valid)
    // ordered entity arrays.
    // Xs are taken into account to achieve efficient physics.
        // N.B. Chunk caches and specific x storage has nothing 
        // to do with physics specifically.
    orderObjects() {
        
        let worldToEntities = this._entityModel.worldEntities;
        let worldToCsToXs = this._xModel.worldToChunksToPortals;
        let portals = this._xModel.portals;
        
        let xAxis = this._xAxis,
            yAxis = this._yAxis,
            zAxis = this._zAxis;
        
        let markedWorlds = new Set();
        let dichotomyLowerBound = Orderer.dichotomyLowerBound;

        let orderCache = Orderer.orderCache;
        
        // Sort entities.
        // Disclaimer: inefficient, but done at startup.
        let sorter = (a, b) => a.val > b.val;
        
        worldToEntities.forEach((entities, wid) => {  
            // Set world as processed.
            markedWorlds.add(wid);
            
            // Get xs.
            let worldXs = worldToCsToXs.get(wid);
            
            // Get axes.
            let currentXAxis = xAxis.get(wid),
                currentYAxis,
                currentZAxis;
            
            if (!currentXAxis) {
                currentXAxis = [];
                currentYAxis = [];
                currentZAxis = [];

                // Fill axes.
                entities.forEach((entity, eid) => {
                    currentXAxis.push({kind: 'e', id: eid, val: entity.position[0]});
                    currentYAxis.push({kind: 'e', id: eid, val: entity.position[1]});
                    currentZAxis.push({kind: 'e', id: eid, val: entity.position[2]});
                });

                if (worldXs) {
                    worldXs.forEach(xs => xs.forEach(xid => {
                        let x = portals.get(xid);
                        let p = x.position;
                        if (!p) return; // Stub portal.
                        currentXAxis.push({kind: 'x', id: xid, val: p[0]});
                        currentYAxis.push({kind: 'x', id: xid, val: p[1]});
                        currentZAxis.push({kind: 'x', id: xid, val: p[2]});
                    }));
                }

                currentXAxis.sort(sorter);
                currentYAxis.sort(sorter);
                currentZAxis.sort(sorter);
                
                // Cache rank in each entity.
                orderCache(currentXAxis, entities, portals, 0, 'indexX');
                orderCache(currentYAxis, entities, portals, 0, 'indexY');
                orderCache(currentZAxis, entities, portals, 0, 'indexZ');
                
                xAxis.set(wid, currentXAxis);
                yAxis.set(wid, currentYAxis);
                zAxis.set(wid, currentZAxis);
            
            } 
            
            else {
                // console.log('[Physics/Orderer]: warn, ordering xs/entities without having flushed.');
                
                currentYAxis = yAxis.get(wid);
                currentZAxis = zAxis.get(wid);
                if (!currentYAxis || !currentZAxis)
                    throw Error('[Physics/Orderer]: axis inconsistency');

                let minAffectedX = currentXAxis.length; // Last element after current addition.
                let minAffectedY = currentYAxis.length; // Same.
                let minAffectedZ = currentZAxis.length;

                // Initialized => must be sorted.
                let completeAxis = kind => (entity, eid) => {
                    // [Thought] really don't run orderObjects for other reasons than initial loading.
                    if (kind === 'x') entity = portals.get(entity);
                    let p = entity.position;
                    if (!p) return; // Stub portals.
                    let x = p[0], y = p[1], z = p[2];

                    // Dichotomy search, insert after.
                    let indexX = dichotomyLowerBound(currentXAxis, entity.position[0], 'val');
                    let indexY = dichotomyLowerBound(currentYAxis, entity.position[1], 'val');
                    let indexZ = dichotomyLowerBound(currentZAxis, entity.position[2], 'val');
                    if (!currentXAxis[indexX]) return; // Not found.

                    while (currentXAxis[indexX].val <= x && currentXAxis[indexX].id !== eid)
                        ++indexX;
                    if (currentXAxis[indexX].id !== eid) {
                        currentXAxis.splice(indexX + 1, 0, {kind: kind, id: eid, val: x});
                        entity.indexX = indexX + 1;
                        minAffectedX = indexX + 2;
                    }
                    else return; // Opt. Others shouldn't be present if first one (x axis) is absent

                    while (currentYAxis[indexY].val <= y && currentYAxis[indexY].id !== eid)
                        ++indexY;
                    if (currentYAxis[indexY].id !== eid) // Should be useless.
                    {
                        currentYAxis.splice(indexY + 1, 0, {kind: kind, id: eid, val: y});
                        entity.indexY = indexY + 1;
                        minAffectedY = indexY + 2;
                    }

                    while (currentZAxis[indexZ].val <= z && currentZAxis[indexZ].id !== eid)
                        ++indexZ;
                    if (currentZAxis[indexZ].id !== eid) // Should be useless as well.
                    {
                        currentZAxis.splice(indexZ + 1, 0, {kind: kind, id: eid, val: z});
                        entity.indexZ = indexZ + 1;
                        minAffectedZ = indexZ + 2;
                    }
                };

                // Complete axes.
                entities.forEach(completeAxis('e'));

                if (worldXs)
                    worldXs.forEach(xs => xs.forEach(completeAxis('x')));

                orderCache(currentXAxis, entities, portals, minAffectedX, 'indexX');
                orderCache(currentYAxis, entities, portals, minAffectedY, 'indexY');
                orderCache(currentZAxis, entities, portals, minAffectedZ, 'indexZ');
                
            }
            
        });
        
        // Independent: sort xs for unvisited worlds.
        worldToCsToXs.forEach((worldXs, wid) => {
            if (markedWorlds.has(wid)) return;

            let currentXAxis = xAxis.get(wid),
                currentYAxis,
                currentZAxis;
            
            let entities = worldToEntities.get(wid);
            
            if (!currentXAxis) {
                currentXAxis = [];
                currentYAxis = [];
                currentZAxis = [];

                worldXs.forEach(xs => xs.forEach(xid => {
                    let x = portals.get(xid);
                    if (!x) throw Error('[Physics/Orderer]: x model inconsistency (chks vs xs).');
                    let p = x.position;
                    if (!p) return; // Stub portal.
                    currentXAxis.push({kind: 'x', id: xid, val: p[0]});
                    currentYAxis.push({kind: 'x', id: xid, val: p[1]});
                    currentZAxis.push({kind: 'x', id: xid, val: p[2]});
                }));

                let sorter = (a, b) => a.val > b.val;
                
                currentXAxis.sort(sorter);
                currentYAxis.sort(sorter);
                currentZAxis.sort(sorter);

                orderCache(currentXAxis, entities, portals, 0, 'indexX');
                orderCache(currentYAxis, entities, portals, 0, 'indexY');
                orderCache(currentZAxis, entities, portals, 0, 'indexZ');

                xAxis.set(wid, currentXAxis);
                yAxis.set(wid, currentYAxis);
                zAxis.set(wid, currentZAxis);
            }
            
            else {
                // console.log('[Physics/Orderer]: warn, ordering xs without having flushed.');
                
                currentYAxis = yAxis.get(wid);
                currentZAxis = zAxis.get(wid);
                if (!currentYAxis || !currentZAxis)
                    throw Error('[Physics/Orderer]: axis inconsistency');

                let minAffectedX = currentXAxis.length;
                let minAffectedY = currentYAxis.length;
                let minAffectedZ = currentZAxis.length;
                
                // Unoptimized searcher.
                let search = (a, id, prop) => {
                    let length = a.length;
                    for (let i = 0; i < length; ++i) {
                        if (a[prop] === id) return i;
                    }
                    return -1;
                };
                
                // Add missing xs.
                worldXs.forEach(xs => xs.forEach(xid => {
                    let x = portals.get(xid);
                    if (!x) throw Error('[Physics/Orderer]: inconsistency in x model (chks vs xs).');
                    
                    let indexX = search(currentXAxis, xid, 'id');
                    if (indexX > -1)
                    {
                        currentXAxis.splice(indexX + 1, 0, {kind: 'x', id: xid, val: x.position[0]});
                        x.indexX = indexX + 1;
                        minAffectedX = indexX + 2;
                    }
                    else return; // Nothing to do. Others should follow.
                    
                    let indexY = search(currentYAxis, xid, 'id');
                    if (indexY > -1) // Check if useless.
                    {
                        currentYAxis.splice(indexY + 1, 0, {kind: 'x', id: xid, val: x.position[1]});
                        x.indexY = indexY + 1;
                        minAffectedY = indexY + 2;
                    }
                    
                    let indexZ = search(currentZAxis, xid, 'id');
                    if (indexZ > -1)
                    {
                        currentZAxis.splice(indexZ + 1, 0, {kind: 'x', id: xid, val: x.position[2]});
                        x.indexZ = indexZ + 1;
                        minAffectedZ = indexZ + 2;
                    }
                }));
                
                orderCache(currentXAxis, entities, portals, minAffectedX, 'indexX');
                orderCache(currentYAxis, entities, portals, minAffectedY, 'indexY');
                orderCache(currentZAxis, entities, portals, minAffectedZ, 'indexZ');
                
            }
            
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
        let p = object.position;
        let x = p[0], y = p[1], z = p[2];
        let eid = kind === 'e' ? object.entityId : object.portalId;
        
        let wid = object.worldId;

        let worldToEntities = this._entityModel.worldEntities;
        let portals = this._xModel.portals;
        let entities = worldToEntities.get(wid);
        
        let xAxis = this._xAxis.get(wid),
            yAxis = this._yAxis.get(wid),
            zAxis = this._zAxis.get(wid);
        
        let dichotomyLowerBound = Orderer.dichotomyLowerBound;
        
        let orderCache = Orderer.orderCache;
        
        if (!xAxis) {
            if (yAxis || zAxis) 
                throw Error('[Physics/Orderer]: axis inconsistency.');
            
            this._xAxis.set(wid, [{kind: kind, id: eid, val: x}]);
            this._yAxis.set(wid, [{kind: kind, id: eid, val: y}]);
            this._zAxis.set(wid, [{kind: kind, id: eid, val: z}]);
            
            object.indexX = 0;
            object.indexY = 0;
            object.indexZ = 0;
        }
        
        else {
            // Dichotomy search, insert after.
            let indexX = dichotomyLowerBound(xAxis, x, 'val');
            let indexY = dichotomyLowerBound(yAxis, y, 'val');
            let indexZ = dichotomyLowerBound(zAxis, z, 'val');
            if (!xAxis[indexX]) return; // Not found
            
            while (xAxis[indexX].val <= x && xAxis[indexX].id !== eid)
                ++indexX;
            if (xAxis[indexX].id !== eid)
            {
                xAxis.splice(indexX + 1, 0, {kind: kind, id: eid, val: x});
                object.indexX = (indexX + 1);
            }
            else return; // Opt. Others shouldn't be present if first one (x axis) is absent

            while (yAxis[indexY].val <= y && yAxis[indexY].id !== eid)
                ++indexY;
            if (yAxis[indexY].id !== eid) // Should be useless.
            {
                yAxis.splice(indexY + 1, 0, {kind: kind, id: eid, val: y});
                object.indexY = (indexY + 1);
            }

            while (zAxis[indexZ].val <= z && zAxis[indexZ].id !== eid)
                ++indexZ;
            if (zAxis[indexZ].id !== eid) // Should be useless as well.
            {
                zAxis.splice(indexZ + 1, 0, {kind: kind, id: eid, val: z});
                object.indexZ = (indexZ + 1);
            }
            
            // Reorder last entities.

            orderCache(xAxis, entities, portals, indexX + 2, 'indexX');
            orderCache(yAxis, entities, portals, indexY + 2, 'indexY');
            orderCache(zAxis, entities, portals, indexZ + 2, 'indexZ');
        }
    }
    
    // [Thought] could be optimised by garbage collection.
    // Keeping a list of active objects for each axis.
    removeObject(object) {
        let kind = object instanceof Entity ? 'e' :
            object instanceof Portal ? 'x' : null;
        if (!kind)
            throw Error('[Physics/Orderer]: invalid object kind.');

        let worldToEntities = this._entityModel.worldEntities;
        let portals = this._xModel.portals;
        
        // Get properties.
        let p = object.position;
        let x = p[0], y = p[1], z = p[2];
        let eid = kind === 'e' ? object.entityId : object.portalId;
        let wid = object.worldId;
        let entities = worldToEntities.get(wid);
            
        let indexX = object.indexX,
            indexY = object.indexY,
            indexZ = object.indexZ;
        
        let xAxis = this._xAxis.get(wid);
        let yAxis = this._yAxis.get(wid);
        let zAxis = this._zAxis.get(wid);
        
        xAxis.splice(indexX, 1);
        yAxis.splice(indexY, 1);
        zAxis.splice(indexZ, 1);
        
        orderCache(xAxis, entities, portals, indexX, 'indexX');
        orderCache(xAxis, entities, portals, indexY, 'indexY');
        orderCache(xAxis, entities, portals, indexZ, 'indexZ');
    }
    
    flush() {
        this._xAxis = new Map();
    }
    
}

export default Orderer;
