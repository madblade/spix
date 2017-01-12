/**
 *
 */

'use strict';

App.Model.Server.XModel.prototype.addPortal = function(portalId, otherPortalId,
                                                              chunkId, worldId, end1, end2, position, orientation)
{
    var graphics = this.app.engine.graphics;
    console.log('Adding portal ' + portalId + ' and linking to ' + otherPortalId);

    // Build portal model.
    if (this.portals.has(portalId)) {
        console.log('Portal ' + portalId + ' was here already...');
    }
    var portal = new App.Model.Server.XModel.Portal(portalId, otherPortalId,
        chunkId, worldId, end1, end2, position, orientation);
    this.portals.set(portalId, portal);


    // Complete other portals which lead to this one.
    var backwards = this.backwardLinks;
    var bplinks = backwards.get(portalId);
    if (bplinks) bplinks.forEach(function(previousPortal) {
        graphics.completeStubPortalObject(previousPortal, portal);
    });

    // Register other end to be linked backwards by this one.
    var otherPortal = otherPortalId ? this.portals.get(otherPortalId) : null;
    if (otherPortal) {
        var blinks = backwards.get(otherPortalId);
        if (blinks) blinks.add(portalId);
        else {
            blinks = new Set();
            blinks.add(otherPortalId);
            backwards.set(portalId, blinks);
        }

    // Do add current portal.
        graphics.addPortalObject(portal, otherPortal);
    } else {
        graphics.addStubPortalObject(portal);
    }

};

App.Model.Server.XModel.prototype.removePortal = function(portalId) {
    var graphics = this.app.engine.graphics;
    console.log('Removing portal ' + portalId);

    var portal = this.portals.get(portalId);
    if (!portal) {
        console.log('\t... portal ' + portalId + ' not present in model.');
    }

    // TODO [CRIT] for all formerly linked, remove part in graphics

    var backwards = this.backwardLinks;
    var linked = backwards.get(portalId);
    if (linked) linked.forEach(function(lportal) {
        graphics.removePartOfPortalObject(lportal, portal);
    });

    graphics.removePortalObject(portal);

    backwards.delete(portalId);
    this.portals.delete(portalId);
};
