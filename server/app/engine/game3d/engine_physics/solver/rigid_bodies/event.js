/**
 *
 */

'use strict';

import EventOrderer from './orderer_events';

class Event {
    
    constructor(position, lifespan, range) {
        
        this._position = position || [0, 0, 0]; // Center.
        this._lifeSpan = lifespan || 1; // Duration.
        
        // Circle, to be specialized.
        // Must not exceed EventOrderer.maxRange  
        this._range = Math.max(range, EventOrderer.maxRange) || .5; 
        this._effect = {acceleration:1};
        
        // Orderer meta.
        this._xIndex = -1;
        this._yIndex = -1;
        this._zIndex = -1;
    }
    
    get position()          { return this._position; }
    set position(position)  { this._position = position; }
    get range()             { return this._range; }
    get effect()            { return this._effect; }
    
    get indexX()            { return this._xIndex; }
    get indexY()            { return this._yIndex; }
    get indexZ()            { return this._zIndex; }
    set indexX(xid)         { this._xIndex = xid; }
    set indexY(yid)         { this._yIndex = yid; }
    set indexZ(zid)         { this._zIndex = zid; }
    
    apply() {
        this._lifeSpan--;
    }
    
    isActive() {
        return this._lifeSpan > 0;
    }
    
}

export default Event;
