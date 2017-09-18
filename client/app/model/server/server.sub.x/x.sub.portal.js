/**
 *
 */

'use strict';

App.Model.Server.XModel.Portal = function(portalId, otherPortalId,
                                          chunkId, worldId, end1, end2, offset, orientation) {

    this.portalId = portalId;
    this.portalLinkedForward = otherPortalId;
    this.chunkId = chunkId;
    this.worldId = worldId;

    var x0 = end1[0]; var x1 = end2[0];
    var y0 = end1[1]; var y1 = end2[1];
    var z0 = end1[2]; var z1 = end2[2];

    if (offset) {
        this.tempOffset = (offset>=0.001 && offset <=0.999) ? offset : 0.999;
    }
    this.tempOrientation = orientation;
    this.tempPosition = [x0, y0, z0];
    this.tempOtherPosition = [x1, y1, z1];
    this.tempWidth = 1;
    this.tempHeight = 2;

};

extend(App.Model.Server.XModel.Portal.prototype, {
    
    //getP: function() {
    //    return 
    //}
    
});
