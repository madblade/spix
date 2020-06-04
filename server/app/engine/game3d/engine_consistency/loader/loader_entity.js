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

    computeEntitiesInRange(player)
    {
        let entityModel = this._entityModel;
        let avatar = player.avatar;
        let aid = avatar.entityId;
        let entities = {};

        let thresh = avatar.entityRenderDistance;
        thresh *= thresh; // Squared distance.

        let distance = GeometryUtils.entitySquaredTransEuclideanDistance;
        // TODO [PERF] compute entity distance as chunk distance
        // let distance = GeometryUtils.entitySquaredEuclideanDistance;

        // TODO [PERF] use Searcher O(n²) -> O(Cn)
        entityModel.forEach(e => { if (!e) return; let eid = e.entityId; if (eid !== aid) {
            if (distance(e, avatar) < thresh)
                entities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};
        }});

        // TODO [PERF] worldify: compute entities on loaded chunks.
        // (as it is the only way to detect in-range entities)

        return entities;
    }

    computeNewEntitiesInRange(player, updatedEntities, addedPlayers, removedPlayers)
    {
        let entityModel = this._entityModel;
        let consistencyModel = this._consistencyModel;
        let avatar = player.avatar;
        let thresh = avatar.entityRenderDistance;
        thresh *= thresh; // Squared distance.

        // TODO [IO] also compute entities on loaded chunks.
        //let distance = GeometryUtils.entitySquaredEuclideanDistance;
        let distance = GeometryUtils.entitySquaredTransEuclideanDistance;

        let addedEntities = {};
        let removedEntities = {};

        // TODO [PERF]: O(n²) -> O(Cn).
        // TODO [PERF]: Use searcher!! or link entities to chunks
        let aid = avatar.entityId;
        // For all different entities.
        entityModel.forEach(e => { if (!e) return; let eid = e.entityId; if (eid !== aid)
        {
            // Compute distance & find in OLD consistency model.
            let isInRange = distance(e, avatar) < thresh;

            // TODO [PERF] n² log² n !! use Searcher instead
            let isPresent = consistencyModel.hasEntity(aid, eid);

            if (isInRange && !isPresent)
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};

            else if (!isInRange && isPresent)
                removedEntities[eid] = null;

            else if (isInRange && updatedEntities.has(eid))
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
