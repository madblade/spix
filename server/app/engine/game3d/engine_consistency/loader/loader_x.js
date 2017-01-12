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
        let connectivity = xm.getConnectivity(worldId, chunk.chunkId, wm, portalLoadingRadius);
        if (!connectivity) return;
        let addedPortals = {};
        let portals = connectivity[0];
        if (portals) portals.forEach((array, portalId) => {
            let partial = cm.isPartialX();
            if (cm.hasX(avatarId, portalId) && !partial) return;

            // Manage other end as a whole.
            if (partial) {
                if (array) {
                    addedPortals[portalId] = [...array]; // Other end id, chunk, xyzp, orientation, world id.
                    cm.unsetPartialX(avatarId, portalId);
                } // Else, nothing to do still.
            } else {
                if (array) {
                    addedPortals[portalId] = [...array];
                } else {
                    // If those other ids have length 0, client will consider the portal blank.
                    addedPortals[portalId] = [0];
                    // Then they are flagged as 'partial' in consistency model.
                    cm.setPartialX(avatarId, portalId);
                }
            }
        });

        // Update out of range portals.
        // TODO [OPTIM] when getConnectivity is performed, just remember which levels correspond to which portals...
        let playerXs = cm.getXIdsForEntity(avatarId);
        let removedPortals = {};

        let chunks = connectivity[1];
        if (chunks) {
            let marks = new Map();
            chunks.forEach(c => marks.set(c[0]+','+c[1], c[2]));

            playerXs.forEach(portalId => {
                let p = xm.getPortal(portalId);
                let i = p.worldId+','+p.chunkId;
                let d = marks.get(i);
                if (d === undefined || d === null || d > portalLoadingRadius)
                    removedPortals[portalId] = null;
            });
        }

        return [addedPortals, removedPortals];
    }

}

export default XLoader;
