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
     */
    constructor(worldId, id, c1, c2, position, orientation) {
        this._id = id;
        this._worldId = worldId;
        this._block1 = c1;
        this._block2 = c2;
        this._position = position;
        this._orientation = orientation;
    }



}

export default Portal;
