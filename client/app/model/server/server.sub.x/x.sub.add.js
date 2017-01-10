/**
 *
 */

'use strict';

App.Model.Server.XModel.prototype.addPartialPortal = function(portalId) {
    var graphics = this.app.engine.graphics;
    console.log('Adding stub portal ' + portalId);
};

App.Model.Server.XModel.prototype.addPortal = function(portalId, otherPortalId,
                                                              chunkId, worldId, end1, end2, position, orientation)
{
    var graphics = this.app.engine.graphics;
    console.log('Adding portal ' + portalId + ' and linking to ' + otherPortalId);
};
