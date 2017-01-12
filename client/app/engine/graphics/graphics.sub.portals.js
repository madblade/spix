/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.addStubPortalObject = function(portal) {
    var worldId = portal.worldId; // World this portal stands in.

};

App.Engine.Graphics.prototype.completeStubPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;

    var otherWorldId = otherPortal.worldId;
};

App.Engine.Graphics.prototype.addPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;

    this.addStubPortalObject(portal);
    this.completeStubPortalObject(portal, otherPortal);
};

App.Engine.Graphics.prototype.removePartOfPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;

};

App.Engine.Graphics.prototype.removePortalObject = function(portal) {
    var worldId = portal.worldId;

};

