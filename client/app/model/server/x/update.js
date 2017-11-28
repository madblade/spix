/**
 *
 */

'use strict';

import { Portal }       from './portal.js';
// import {}

var UpdateModule = {

    addPortal: function(portalId, otherPortalId,
                        chunkId, worldId, end1, end2, offset, orientation)
    {
        console.log('Adding portal ' + portalId + ' and linking to ' + otherPortalId);
        portalId = parseInt(portalId, 10);

        // Build portal model.
        if (this.portals.has(portalId)) {
            console.log('Portal ' + portalId + ' was here already...');
        }

        var portal = new Portal(portalId, otherPortalId,
            chunkId, worldId, end1, end2, offset, orientation);

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
    },

    removePortal: function(portalId)
    {
        portalId = parseInt(portalId, 10);

        var modelPortals = this.portals;
        var worldToPortals = this.worldToPortals;

        console.log('Removing portal ' + portalId + ' ' + typeof portalId);

        var portal = modelPortals.get(portalId);
        if (!portal) {
            console.log('\t... portal ' + portalId + ' not present in model.');
        }

        // Impact model.
        modelPortals.delete(portalId);

        // Impact world-portal model.
        if (portal) {
            var worldId = portal.worldId;
            var worldPortals = worldToPortals.get(worldId);
            worldPortals.delete(portalId);
            if (worldPortals.size < 1) worldToPortals.delete(worldId);
        }
    }

};

export { UpdateModule };
