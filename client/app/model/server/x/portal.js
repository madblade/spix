/**
 *
 */

'use strict';

import extend           from '../../../extend.js';

let Portal = function(
    portalId, otherPortalId,
    chunkId, worldId, end1, end2, offset, orientation)
{
    this.portalId = portalId;
    this.portalLinkedForward = otherPortalId;
    this.chunkId = chunkId;
    this.worldId = worldId;

    let x0 = end1[0]; let x1 = end2[0];
    let y0 = end1[1]; let y1 = end2[1];
    let z0 = end1[2]; let z1 = end2[2];

    if (offset) {
        this.tempOffset = offset >= 0.001 && offset <= 0.999 ? offset : 0.999;
    }

    this.tempOrientation = orientation;
    this.tempPosition = [x0, y0, z0];
    this.tempOtherPosition = [x1, y1, z1];
    this.tempWidth = 1;
    this.tempHeight = 2;
};

extend(Portal.prototype, {

    //getP: function() {
    //    return
    //}

});

export { Portal };
