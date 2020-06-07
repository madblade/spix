/**
 * Load and prepare chunks for players.
 */

'use strict';

import GeometryUtils        from '../../../math/geometry';

class EntityLoader
{
    constructor(consistencyEngine)
    {
        this._entityModel = consistencyEngine.entityModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    // TODO [PERF]: Use searcher O(n²) -> O(n), or link entities to chunks.
    // (quadratic as fn of players, not entities!)
    computeNewEntitiesInRange(
        player, updatedEntities, addedPlayers, removedPlayers
    )
    {
        let entityModel = this._entityModel;
        let consistencyModel = this._consistencyModel;
        let avatar = player.avatar;
        let thresh = avatar.entityRenderDistance;
        thresh *= thresh; // Squared distance.

        // TODO [IO] also compute entities on loaded chunks.
        let distance = GeometryUtils.entitySquaredTransEuclideanDistance;

        // TODO [PERF] [IO] use array
        let addedEntities = {};
        let removedEntities = {};

        let aid = avatar.entityId;
        // For all different entities.
        entityModel.forEach(e => { if (!e) return; let eid = e.entityId; if (eid !== aid)
        {
            // Compute distance & find in OLD consistency model.
            let isInRange = distance(e, avatar) < thresh;

            let isPresent = consistencyModel.hasEntity(aid, eid);

            if (isInRange && !isPresent)
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};

            else if (!isInRange && isPresent)
                removedEntities[eid] = null;

            else if (isInRange && (updatedEntities.has(eid) || updatedEntities.has(aid)))
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};
        }});

        removedPlayers.forEach(eid => {
            if (consistencyModel.hasEntity(aid, eid))
                removedEntities[eid] = null;
        });

        return [addedEntities, removedEntities];
    }
}

export default EntityLoader;
