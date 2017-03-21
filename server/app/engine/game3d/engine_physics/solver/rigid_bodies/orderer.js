/**
 *
 */

'use strict';

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
    
    // Compute sorted axes from scratch or from partial (valid)
    // ordered entity arrays.
    // Xs are taken into account to achieve efficient physics.
        // N.B. Chunk caches and specific x storage has nothing 
        // to do with physics specifically.
    orderObjects() {
        
        let worldToEntities = this._entityModel.worldEntities;
        let worldToCsToXs = this._xModel.worldToChunksToPortals;
        
        let xAxis = this._xAxis,
            yAxis = this._yAxis,
            zAxis = this._zAxis;
        
        let markedWorlds = new Set();
        
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
                    worldXs.forEach(xs => xs.forEach((x, xid) => {
                        currentXAxis.push({kind: 'x', id: xid, val: x.position[0]});
                        currentYAxis.push({kind: 'x', id: xid, val: x.position[1]});
                        currentZAxis.push({kind: 'x', id: xid, val: x.position[2]});
                    }))
                }
                
                // Sort entities.
                // Disclaimer: inefficient, but done at startup.
                let sorter = (a, b) => a.val > b.val;

                currentXAxis.sort(sorter);
                currentYAxis.sort(sorter);
                currentZAxis.sort(sorter);
                
                xAxis.set(wid, currentXAxis);
                yAxis.set(wid, currentYAxis);
                zAxis.set(wid, currentZAxis);
            
            } 
            
            else {
                currentYAxis = yAxis.get(wid);
                currentZAxis = zAxis.get(wid);
                if (!currentYAxis || !currentZAxis)
                    throw Error('[Physics/Orderer]: axis inconsistency');
                
                // Initialized => must be sorted.
                let dichotomyLowerBound = function(a, value, prop) {
                    var lo = 0, hi = a.length - 1, mid;
                    while (lo <= hi) {
                        mid = (lo + hi) >> 1; // floor((lo+hi)/2)
                        if (a[mid][prop] > value) hi = mid - 1;
                        else if (a[mid][prop] < value) lo = mid + 1;
                        else return mid;
                    }
                    return lo;
                };
                
                let completeAxis = kind => (entity, eid) => {
                    // Dichotomy search and insert.
                    let lowerBoundX = dichotomyLowerBound(currentXAxis, entity.position[0], 'val');
                    let lowerBoundXValue = currentXAxis[lowerBoundX].val;
                    let indexX = lowerBoundX;

                    let lowerBoundY = dichotomyLowerBound(currentXAxis, entity.position[1], 'val');
                    let lowerBoundYValue = currentYAxis[lowerBoundY].val;
                    let indexY = lowerBoundY;

                    let lowerBoundZ = dichotomyLowerBound(currentXAxis, entity.position[2], 'val');
                    let lowerBoundZValue = currentZAxis[lowerBoundZ].val;
                    let indexZ = lowerBoundZ;

                    while (lowerBoundXValue === currentXAxis[indexX].val && currentXAxis[indexX].id !== eid)
                        ++indexX;
                    if (currentXAxis[indexX].id !== eid)
                        currentXAxis.splice(indexX + 1, 0, {kind: kind, id: eid, val: entity.position[0]});
                    else return; // Opt. Others shouldn't be present if first one (x axis) is absent

                    while (lowerBoundYValue === currentYAxis[indexY].val && currentYAxis[indexY].id !== eid)
                        ++indexY;
                    if (currentYAxis[indexY].id !== eid) // Should be useless.
                        currentYAxis.splice(indexY + 1, 0, {kind: kind, id: eid, val: entity.position[0]});

                    while (lowerBoundZValue === currentZAxis[indexZ].val && currentZAxis[indexZ].id !== eid)
                        ++indexZ;
                    if (currentZAxis[indexZ].id !== eid) // Should be useless as well.
                        currentZAxis.splice(indexZ + 1, 0, {kind: kind, id: eid, val: entity.position[0]});
                };
                
                // Complete axes.
                entities.forEach(completeAxis('e'));

                if (worldXs) {
                    worldXs.forEach(xs => xs.forEach(completeAxis('x')));
                }
                
            }
            
        });
        
        worldToCsToXs.forEach((csToXs, wid) => {
            if (markedWorlds.has(wid)) return;

            let currentXAxis = xAxis.get(wid),
                currentYAxis,
                currentZAxis;
            
            if (!currentXAxis) {
                currentXAxis = [];
                currentYAxis = [];
                currentZAxis = [];

                csToXs.forEach((x, xid) => {
                    currentXAxis.push({kind: 'x', id: xid, val: x.position[0]});
                    currentYAxis.push({kind: 'x', id: xid, val: x.position[1]});
                    currentZAxis.push({kind: 'x', id: xid, val: x.position[2]});
                });

                let sorter = (a, b) => a.val > b.val;
                
                currentXAxis.sort(sorter);
                currentYAxis.sort(sorter);
                currentZAxis.sort(sorter);
                
                xAxis.set(wid, currentXAxis);
                yAxis.set(wid, currentYAxis);
                zAxis.set(wid, currentZAxis);
            }
            
            else {
                currentYAxis = yAxis.get(wid);
                currentZAxis = zAxis.get(wid);
                if (!currentYAxis || !currentZAxis)
                    throw Error('[Physics/Orderer]: axis inconsistency');
                
                // Unoptimized searcher.
                let search = (a, id, prop) => {
                    let length = a.length;
                    for (let i = 0; i < length; ++i) {
                        if (a[prop] === id) return i;
                    }
                    return -1;
                };
                
                // Add missing xs.
                csToXs.forEach((x, xid) => {
                    let indexX = search(currentXAxis, xid, 'id');
                    if (indexX === -1)
                        currentXAxis.splice(indexX + 1, 0, {kind: 'x', id: xid, val: x.position[0]});
                    else return; // Nothing to do. Others should follow.
                    
                    let indexY = search(currentYAxis, xid, 'id');
                    if (indexY === -1)
                        currentYAxis.splice(indexY + 1, 0, {kind: 'x', id: xid, val: x.position[1]});
                    
                    let indexZ = search(currentZAxis, xid, 'id');
                    if (indexZ === -1)
                        currentZAxis.splice(indexZ + 1, 0, {kind: 'x', id: xid, val: x.position[2]});
                });
                
            }
            
        });
    
    }
    
    addObject(object) {
        // get x, y, z
        // get width, height, depth
        
        // object must have idx, idy, idz
    }
    
    removeObject(object) {
        
    }
    
}

export default Orderer;
