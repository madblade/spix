/**
 *
 */

'use strict';

import GeometryUtils        from '../../../math/geometry';

class XLoader {

    constructor(consistencyEngine) {
        this._xModel = consistencyEngine.xModel;
        this._worldModel = consistencyEngine.worldModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    computeNewXInRange(player) {
        let a = player.avatar;
        let avatarId = a.id;
        let p = a.position;
        let worldId = a.worldId;
        let portalLoadingRadius = a.portalRenderDistance;

        let wm = this._worldModel;
        let xm = this._xModel;
        let cm = this._consistencyModel;

        let chunk = wm.getWorld(worldId).getChunkByCoordinates(...p);
        // Format:
        // Map (portal id -> [other portal id, other portal world])

        // Compute new portals in range.
        let portals = xm.getConnectivity(chunk.chunkId, worldId, portalLoadingRadius);
        let addedPortals = {};
        if (portals) portals.forEach((array, portalId) => {
            let partial = cm.isPartialX();
            if (cm.hasX(avatarId, portalId) && !partial) return;

            // Manage other end as a whole.
            if (partial) {
                if (array) {
                    addedPortals[portalId] = [...array]; // Other end id, other world id.
                    cm.unsetPartialX(avatarId, portalId);
                } // Else, nothing to do still.
            } else {
                if (array) {
                    addedPortals[portalId] = [...array];
                } else {
                    // If those other ids are null, client will consider the portal blank.
                    addedPortals[portalId] = null;
                    // Then they are flagged as 'partial' in consistency model.
                    cm.setPartialX(avatarId, portalId);
                }
            }
        });

        // Update out of range portals.
        let playerXs = cm.getXIdsForEntity(avatarId);
        let removedPortals = {};
        playerXs.forEach(portalId => {
            let p = xm.getPortal(portalId);
            if (GeometryUtils.entityToPortalDistance(a, p, xm, wm, portalLoadingRadius) > portalLoadingRadius)
                removedPortals[portalId] = null;
        });

        return [addedPortals, removedPortals];
    }

}

export default XLoader;
