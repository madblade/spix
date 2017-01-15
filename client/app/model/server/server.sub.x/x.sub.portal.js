/**
 *
 */

'use strict';

App.Model.Server.XModel.Portal = function(portalId, otherPortalId,
                                          chunkId, worldId, end1, end2, position, orientation) {

    this.portalId = portalId;
    this.portalLinkedForward = otherPortalId;
    this.chunkId = chunkId;
    this.worldId = worldId;

    var x0 = end1[0]; var x1 = end2[0];
    var y0 = end1[1]; var y1 = end2[1];
    var z0 = end1[2]; var z1 = end2[2];

    // TODO [CRIT] worldiy client with chunk sizes...
    this.tempPosition = [x0, y0, z0];
    this.tempWidth = 1;
    this.tempHeight = 2;

};
