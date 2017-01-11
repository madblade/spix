/**
 *
 */

'use strict';

/*
App.Model.Server.XModel.prototype.addStubPortal = function(portalId) {
    var graphics = this.app.engine.graphics;
    console.log('Adding stub portal ' + portalId);

    this.portals.set(portalId, null);
    graphics.addPortalObject(portalId);
};
*/

App.Model.Server.XModel.prototype.addPortal = function(portalId, otherPortalId,
                                                              chunkId, worldId, end1, end2, position, orientation)
{
    var graphics = this.app.engine.graphics;
    console.log('Adding portal ' + portalId + ' and linking to ' + otherPortalId);


    var portal = new App.Model.Server.XModel.Portal(portalId, otherPortalId,
        chunkId, worldId, end1, end2, position, orientation);
    this.portals.set(portalId, portal);

    graphics.addPortalObject(portal);
};

App.Model.Server.XModel.prototype.removePortal = function(portalId) {
    var graphics = this.app.engine.graphics;
    console.log('Removing portal ' + portalId);

    this.portals.delete(portalId);
};
