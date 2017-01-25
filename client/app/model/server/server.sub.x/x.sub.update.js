/**
 *
 */

'use strict';

App.Model.Server.XModel.prototype.addPortal = function(portalId, otherPortalId,
                                                              chunkId, worldId, end1, end2, position, orientation)
{
    var graphics = this.app.engine.graphics;
    console.log('Adding portal ' + portalId + ' and linking to ' + otherPortalId);
    portalId = parseInt(portalId);

    // Build portal model.
    if (this.portals.has(portalId)) {
        console.log('Portal ' + portalId + ' was here already...');
    }

    var portal = new App.Model.Server.XModel.Portal(portalId, otherPortalId,
        chunkId, worldId, end1, end2, position, orientation);

    // Add portal to model.
    this.portals.set(portalId, portal);

    // Add to world-portal model.
    var worldPortals = this.worldToPortals.get(worldId);
    if (worldPortals) worldPortals.add(portalId);
    else {
        worldPortals = new Set();
        worldPortals.add(portalId);
        this.worldToPortals.set(worldId, worldPortals);
    }

    // Complete other portals which lead to this one.
    var backwards = this.backwardLinks;
    var bplinks = backwards.get(portalId);
    console.log(backwards);
    console.log(portalId + ', ' + bplinks);
    var portals = this.portals;
    if (bplinks) bplinks.forEach(function(previousPortalId) {
        var previousPortal = portals.get(previousPortalId);
        graphics.completeStubPortalObject(previousPortal, portal);
    });

    // Register other end to be linked backwards by this one.
    var otherPortal = otherPortalId ? this.portals.get(otherPortalId) : null;
    if (otherPortal) {
        this.addBackwardLinks(portalId, otherPortalId);
        this.addBackwardLinks(otherPortalId, portalId);

    // Do add current portal.
        graphics.addPortalObject(portal, otherPortal);
    } else {
        if (otherPortalId) {
            this.addBackwardLinks(otherPortalId, portalId);
            graphics.addStubPortalObject(portal, otherPortalId);
        } else {
            console.log('Error building stub portal: could not get other end.');
        }
    }

};

// portalId -> otherPortalId
App.Model.Server.XModel.prototype.addBackwardLinks = function(portalId, otherPortalId) {
    var backwards = this.backwardLinks;
    var blinks = backwards.get(otherPortalId);
    if (blinks) blinks.add(portalId);
    else {
        blinks = new Set();
        blinks.add(otherPortalId);
        backwards.set(portalId, blinks);
    }
};

App.Model.Server.XModel.prototype.removePortal = function(portalId) {
    var graphics = this.app.engine.graphics;
    console.log('Removing portal ' + portalId);

    var portal = this.portals.get(portalId);
    if (!portal) {
        console.log('\t... portal ' + portalId + ' not present in model.');
    }

    // Impact link model.
    var backwards = this.backwardLinks;
    var linked = backwards.get(portalId);
    if (linked) linked.forEach(function(lportal) {
        graphics.removePartOfPortalObject(lportal, portal);
    });
    backwards.delete(portalId);

    // Impact world-portal model
    if (portal) {
        var worldId = portal.worldId;
        var worldPortals = this.worldToPortals.get(worldId);
        worldPortals.delete(portalId);
        if (worldPortals.size < 1) this.worldToPortals.delete(worldId);
    }

    // Impact portal model.
    if (portal) graphics.removePortalObject(portal);
    this.portals.delete(portalId);
};
