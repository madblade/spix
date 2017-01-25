/**
 *
 */

'use strict';

App.Model.Server.XModel = function(app, selfModel) {
    this.app = app;
    this.selfModel = selfModel;

    /** Model component **/

    // Portal id -> portal (knows self world, forward portal)
    this.portals = new Map();

    // World id -> set of all portals contained in this world
    this.worldToPortals = new Map();

    // Portal id -> set of all portals that link to this one
    this.backwardLinks = new Map();

    // Map helper
    this.worldMap = new App.Model.Server.XModel.WorldMap(this);

    /** Buffer **/
    this.xUpdates = [];

    /** Graphical component **/
    this.needsUpdate = false;
};

extend(App.Model.Server.XModel.prototype, {

    init: function() {},

    // Should always be called AFTER worldModel.refresh()
    // So there is no more world to be added, all possible worlds
    // are available for display in their portals texture renderer.
    refresh: function() {
        if (!this.needsUpdate) return;

        var register = this.app.register;
        var worldMap = this.worldMap;
        var updates = this.xUpdates;

        for (var i = 0, l = updates.length; i < l; ++i) {
            var data = updates[i];
            for (var portalId in data) {

                var meta = data[portalId];
                var isArray = meta instanceof Array;

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
                    worldMap.invalidate();
                    register.updateSelfState({'diagram': worldMap.toString()});
                } else {
                    // Null -> remove portal
                    this.removePortal(portalId);
                    worldMap.invalidate();
                    register.updateSelfState({'diagram': worldMap.toString()});
                }
            }
        }

        this.xUpdates = [];
        this.needsUpdate = false;
    },

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
    updateX: function(data) {
        this.xUpdates.push(data);
        this.needsUpdate = true;
    }

});
