/**
 *
 */

'use strict';

import Portal from './portal';

class Knot {

    /**
     * @param id knot id in XModel
     * @param portal1 first portal
     * @param portal2 second (if not, generated) portal
     */
    constructor(id, portal1, portal2) {

        this._id = id;
        this._portal1 = portal1;

        if (!portal2) {
            // TODO add random portal.
            // TODO pick random world or create one.
            portal2 = new Portal();
        }

        this._portal2 = portal2;
    }

    get id()        { return this._id; }
    get portal2()   { return this._portal2; }
    get portal1()   { return this._portal1; }

    otherEnd(portal) {
        if (portal === this._portal1) return this._portal2;
        else if (portal === this._portal2) return this._portal1;
        else return null;
    }

    // Can a portal link to itself?
    removePortal(portal) {
        if (portal === this._portal1)
            this._portal1 = null;
        else if (portal === this._portal2)
            this._portal2 = null;
    }

}

export default Knot;
