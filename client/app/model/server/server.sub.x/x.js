/**
 *
 */

'use strict';

App.Model.Server.XModel = function(app) {
    this.app = app;

    // Model component
    this.portals = new Map();

    // Buffer
    this.xUpdates = [];

    // Graphical component
    this.needsUpdate = false;
};

App.Model.Server.XModel.prototype.init = function() {};

App.Model.Server.XModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;

    let updates = this.xUpdates;
    for (var i = 0, l = updates.length; i < l; ++i) {
        var data = updates[i];
        for (var portalId in data) {

            var meta = data[portalId];
            var isArray = meta instanceof Array;
            // TODO [CRIT] worldify test & uncomment
            /* if (isArray && meta.length === 1) {
                // Raw portal.
                this.addStubPortal(portalId);
            } else */
            if (isArray && meta.length > 0) {
                // Full portal.

                var otherPortalId   = meta[0];
                var chunkId         = meta[1];
                var worldId         = meta[2];
                var end1            = [meta[3], meta[4], meta[5]];
                var end2            = [meta[6], meta[7], meta[8]];
                var position        = meta[9];
                var orientation     = meta[10];

                this.addPortal(portalId, otherPortalId, chunkId, worldId, end1, end2, position, orientation);

            } else {
                // Null -> remove portal
                this.removePortal(portalId);
            }
        }
    }

    this.xUpdates = [];
    this.needsUpdate = false;
};

/** API
 *  [11] -> new linked portal
    0:448165    -> other portal id (null -> blank portal)
    1:"0,0,0"   -> current side's chunk id (could change: f.x. in the same world)
    2:645486    -> current side's world id
    3:2         -> b1.x (absolutes)
    4:8         -> b1.y |
    5:17        -> b1.z |
    6:2         -> b2.x |
    7:8         -> b2.y |
    8:18        -> b2.z |==> determination of which axis portal is orthogonal to
    9:0.999     -> position (/rel + axix)
    10:"both"   -> orientation ("+", "-" or "both")
 * null -> removed portal
 **/
App.Model.Server.XModel.prototype.updateX = function(data) {
    this.xUpdates.push(data);
    this.needsUpdate = true;
};
