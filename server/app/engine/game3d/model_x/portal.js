/**
 *
 */

'use strict';

class Portal {

    /**
     * @param worldId origin world.
     * @param id identifier in XModel
     * @param c1 first 3-array position in specified world
     * @param c2 second 3-array block position in specified world
     * @param offset (ratio of advancement in the + coordinate direction)
     * @param orientation (looking at 'first' or 'next')
     * @param chunk origin chunk (portals are fixed ATM)
     */
    constructor(worldId, id, c1, c2, offset, orientation, chunk) {
        this._portalId = id;
        this._worldId = worldId;
        this._block1 = c1;
        this._block2 = c2;
        this._offset = offset; // Ratio. TODO [MEDIUM] use different name.
        this._orientation = orientation;
        this._chunk = chunk;
        
        // Physics properties and optimization.
        this._indexX = -1;
        this._indexY = -1;
        this._indexZ = -1;
    }

    get portalId()  { return this._portalId; }
    get worldId()   { return this._worldId; }
    get chunkId()   { return this._chunk.chunkId; }
    get state()     { return [...this._block1, ...this._block2, this._offset, this._orientation]; }
    get chunk()     { return this._chunk; }

    // Physics.
    set indexX(indexX)  { this._indexX = indexX; }
    get indexX()        { return this._indexX; }
    set indexY(indexY)  { this._indexY = indexY; }
    get indexY()        { return this._indexY; }
    set indexZ(indexZ)  { this._indexZ = indexZ; }
    get indexZ()        { return this._indexZ; }
    
    // Position! Not ratio!
    get position()  { 
        let b1 = this._block1;
        let b2 = this._block2;
        if (!b1 || !b2) return;
        
        var p = [0, 0, 0];
        for (let i = 0; i < 3; ++i) 
            p[i] = (b1[i] + b2[i]) * .5;
        
        return p; 
    } 
}

export default Portal;
