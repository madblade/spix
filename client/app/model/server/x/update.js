/**
 *
 */

'use strict';

import { Portal }       from './portal.js';

let UpdateModule = {

    addPortal(
        portalId, otherPortalId,
        chunkId, worldId, end1, end2, offset, orientation
    )
    {
        console.log(`Adding portal ${portalId} and linking to ${otherPortalId}`);
        portalId = parseInt(portalId, 10);

        // Build portal model.
        if (this.portals.has(portalId)) {
            console.log(`Portal ${portalId} was here already...`);
        }

        let portal = new Portal(portalId, otherPortalId,
            chunkId, worldId, end1, end2, offset, orientation);

        // Add portal to model.
        this.portals.set(portalId, portal);

        // Add to world-portal model.
        let worldPortals = this.worldToPortals.get(worldId);
        if (worldPortals) worldPortals.add(portalId);
        else {
            worldPortals = new Set();
            worldPortals.add(portalId);
            this.worldToPortals.set(worldId, worldPortals);
        }
    },

    removePortal(portalId)
    {
        portalId = parseInt(portalId, 10);

        let modelPortals = this.portals;
        let worldToPortals = this.worldToPortals;

        // console.log(`Removing portal ${portalId}  ${typeof portalId}`);

        let portal = modelPortals.get(portalId);
        if (!portal) {
            console.log(`\t... portal ${portalId} not present in model.`);
        }

        // Impact model.
        modelPortals.delete(portalId);

        // Impact world-portal model.
        if (portal) {
            let worldId = portal.worldId;
            let worldPortals = worldToPortals.get(worldId);
            worldPortals.delete(portalId);
            if (worldPortals.size < 1) worldToPortals.delete(worldId);
        }
    }

};

export { UpdateModule };
