/**
 *
 */


'use strict';

import extend               from '../../../extend.js';

import { WorldMap }         from './worldmap.js';
import { UpdateModule }     from './update.js';

let XModel = function(app, selfModel)
{
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

    init() {},

    // Should always be called AFTER worldModel.refresh()
    // So there is no more world to be added, all possible worlds
    // are available for display in their portals texture renderer.
    refresh()
    {
        if (!this.needsUpdate && !this.forceUpdate) return;

        let register = this.app.register;
        let worldMap = this.worldMap;
        let updates = this.xUpdates;
        let refreshWorldMap = false;
        let graphics = this.app.engine.graphics;

        for (let i = 0, l = updates.length; i < l; ++i)
        {
            let data = updates[i];

            for (let portalId in data) {
                if (!data.hasOwnProperty(portalId)) continue;
                let meta = data[portalId];
                let isArray = meta instanceof Array;

                if (isArray && meta.length > 0) {
                    // Full portal.
                    let otherPortalId   = meta[0];
                    let chunkId         = meta[1];
                    let worldId         = meta[2];
                    let end1            = [meta[3], meta[4], meta[5]];
                    let end2            = [meta[6], meta[7], meta[8]];
                    let offset          = meta[9];
                    let orientation     = meta[10];

                    // Do add portal (not that world map is recomputed in process)
                    this.addPortal(
                        portalId,
                        otherPortalId,
                        chunkId, worldId, end1, end2,
                        offset, orientation
                    );
                    refreshWorldMap = true;
                }

                else {
                    // Null -> remove portal
                    this.removePortal(portalId);
                    refreshWorldMap = true;
                }
            }
        }

        if (refreshWorldMap || this.forceUpdate)
        {
            // console.log('[X] Updating world graph render force.');

            let s = worldMap
                .invalidate()
                .computeWorldMap()
                .computeFlatGraph();
            // Alternatively, use worldMap.toString();

            register.updateSelfState({diagram: s});
            // Possible perf improvements here.
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
    updateX(data)
    {
        this.xUpdates.push(data);
        this.needsUpdate = true;
    },

    switchAvatarToWorld(oldWorldId, newWorldId)
    {
        console.log('[X] Switching avatar to other world');
        oldWorldId = parseInt(oldWorldId, 10);
        newWorldId = parseInt(newWorldId, 10);
        this.worldMap.switchRoot(oldWorldId, newWorldId);
        //this.forceUpdate = true;
    },

    cleanup()
    {
        this.portals.clear();
        this.worldToPortals.clear();
        this.worldMap = new WorldMap(this);
        this.xUpdates = [];
        this.needsUpdate = false;
        this.forceUpdate = false;
        // XXX [CLEANUP] graphical component, scenes and render targets
    }

});

extend(XModel.prototype, UpdateModule);

export { XModel };
