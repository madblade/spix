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
    
    orderObjects() {
        
        let worldToEntities = this._entityModel.worldEntities;
        let worldToCsToXs = this._xModel.worldToChunksToPortals;
        
        let xAxis = this._xAxis, 
            yAxis = this._yAxis,
            zAxis = this._zAxis;
        
        worldToEntities.forEach((entities, wid) => {
            
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
                    currentXAxis.push(eid);
                    currentYAxis.push(eid);
                    currentZAxis.push(eid);
                });

                if (worldXs) {
                    worldXs.forEach(xs => xs.forEach((x, portalId) => {
                        let xid = -portalId;
                        currentXAxis.push(xid);
                        currentYAxis.push(xid);
                        currentZAxis.push(xid);
                    }))
                }
                
                // Sort entities.
                // Disclaimer: inefficient, but done at startup.
                let sorter = axis => (a, b) => companion[axis][a] > companion[axis][b];

                currentXAxis.sort(sorter(0));
                currentXAxis.sort(sorter(1));
                currentXAxis.sort(sorter(2));
                
                xAxis.set(wid, currentXAxis);
                yAxis.set(wid, currentYAxis);
                zAxis.set(wid, currentZAxis);    
            
            } else {
                currentYAxis = yAxis.get(wid);
                currentZAxis = zAxis.get(wid);
                if (!currentYAxis || !currentZAxis)
                    throw Error('[FrontEnd/Orderer]: axis inconsistency');
                
                // Initialized => must be sorted.

                // Complete axes.
                entities.forEach((entity, eid) => {
                    // TODO Dichotomy search.
                    if (currentXAxis.indexOf(eid) === -1) currentXAxis.push(eid);
                    if (currentYAxis.indexOf(eid) === -1) currentYAxis.push(eid);
                    if (currentZAxis.indexOf(eid) === -1) currentZAxis.push(eid);
                });

                if (worldXs) {
                    worldXs.forEach(xs => xs.forEach((x, portalId) => {
                        let xid = -portalId;
                        if (currentXAxis.indexOf(xid) === -1) currentXAxis.push(xid);
                        if (currentYAxis.indexOf(xid) === -1) currentYAxis.push(xid);
                        if (currentZAxis.indexOf(xid) === -1) currentZAxis.push(xid);
                    }))
                }
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
