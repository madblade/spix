/**
 *
 */


'use strict';

import extend               from '../../../extend.js';

import { WorldMap }         from './worldmap.js';
import { UpdateModule }     from './update.js';

var XModel = function(app, selfModel) {
    this.app = app;
    this.selfModel = selfModel;

    /** Model component **/

    // Portal id -> portal (knows self world, forward portal)
    this.portals = new Map();

    // World id -> set of all portals contained in this world
    this.worldToPortals = new Map();

    // Map helper
    this.worldMap = new WorldMap(this);

    /** Buffer **/
    this.xUpdates = [];

    /** Graphical component **/
    this.needsUpdate = false;
    this.forceUpdate = false;
};

extend(XModel.prototype, {

    init: function() {},

    // Should always be called AFTER worldModel.refresh()
    // So there is no more world to be added, all possible worlds
    // are available for display in their portals texture renderer.
    refresh: function() {
        if (!this.needsUpdate && !this.forceUpdate) return;

        var register = this.app.register;
        var worldMap = this.worldMap;
        var updates = this.xUpdates;
        var refreshWorldMap = false;
        var graphics = this.app.engine.graphics;

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
                    var offset          = meta[9];
                    var orientation     = meta[10];

                    // Do add portal (not that world map is recomputed in process)
                    this.addPortal(portalId,
                        otherPortalId, chunkId, worldId, end1, end2, offset, orientation);
                    refreshWorldMap = true;
                }

                else {
                    // Null -> remove portal
                    this.removePortal(portalId);
                    refreshWorldMap = true;
                }
            }
        }

        if (refreshWorldMap || this.forceUpdate) {
            console.log('[X] Updating world graph render force force.');

            var s = worldMap
                .invalidate()
                .computeWorldMap()
                .computeFlatGraph()
                .toString();

            register.updateSelfState({diagram: s});
            // TODO [HIGH] this should be heavily optimized.
            worldMap.computeRenderingGraph(graphics);
            this.forceUpdate = false;
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
    },

    switchAvatarToWorld: function(oldWorldId, newWorldId) {
        console.log('[X] Switching avatar to other world');
        oldWorldId = parseInt(oldWorldId, 10);
        newWorldId = parseInt(newWorldId, 10);
        this.worldMap.switchRoot(oldWorldId, newWorldId);
        //this.forceUpdate = true;
    }

});

extend(XModel.prototype, UpdateModule);

export { XModel };
