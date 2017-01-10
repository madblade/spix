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
     * @param position (ratio of advancement in the + coordinate direction)
     * @param orientation (looking at '+', '-' or 'both')
     * @param chunk origin chunk (portals are fixed ATM)
     */
    constructor(worldId, id, c1, c2, position, orientation, chunk) {
        this._id = id;
        this._worldId = worldId;
        this._block1 = c1;
        this._block2 = c2;
        this._position = position;
        this._orientation = orientation;
        this._chunk = chunk;
    }

    get id()        { return this._id; }
    get worldId()   { return this._worldId; }
    get chunkId()   { return this._chunk.chunkId; }
    get state()     { return [...this._block1, ...this._block2, this._position, this._orientation]; }
    get chunk()     { return this._chunk; }

}

export default Portal;
