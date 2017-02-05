/**
 * Load and prepare chunks for players.
 */

'use strict';

import GeometryUtils        from '../../../math/geometry';

class EntityLoader {

    constructor(consistencyEngine) {
        this._entityModel = consistencyEngine.entityModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    computeEntitiesInRange(player) {
        let entityModel = this._entityModel;
        let avatar = player.avatar;
        let aid = avatar.id;
        var entities = {};

        let thresh = avatar.entityRenderDistance;
        thresh *= thresh; // Squared distance.

        let distance = GeometryUtils.entitySquaredTransEuclideanDistance;
        // TODO [HIGH] compute entity distance as chunk distance
        // let distance = GeometryUtils.entitySquaredEuclideanDistance;

        // TODO [LACKS] optim O(n²) -> O(Cn)
        entityModel.forEach(e => { let eid = e.id; if (eid !== aid) {
            if (distance(e, avatar) < thresh)
                entities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};
        }});

        // TODO [HIGH] worldify: compute entities on loaded chunks.
        // (as it is the only way to detect in-range entities)

        return entities;
    }

    computeNewEntitiesInRange(player, updatedEntities, addedPlayers, removedPlayers) {
        let entityModel = this._entityModel;
        let consistencyModel = this._consistencyModel;
        let avatar = player.avatar;
        let thresh = avatar.entityRenderDistance;
        thresh *= thresh; // Squared distance.

        // TODO [HIGH] also compute entities on loaded chunks.
        //let distance = GeometryUtils.entitySquaredEuclideanDistance;
        let distance = GeometryUtils.entitySquaredTransEuclideanDistance;

        var addedEntities = {};
        var removedEntities = {};

        // TODO [LACKS]: O(n²) -> O(Cn).
        // TODO [HIGH]: also use for AABB phase in physics.
        let aid = avatar.id;
        entityModel.forEach(e => { let eid = e.id; if (eid !== aid) { // For all different entities.

            // Compute distance & find in OLD consistency model.
            let isInRange = distance(e, avatar) < thresh;

            // TODO [PERF] n² log² n !!
            let isPresent = consistencyModel.hasEntity(aid, eid);

            if (isInRange && !isPresent)
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};
                // TODO [MEDIUM] manage transition several world ids.

            else if (!isInRange && isPresent)
                removedEntities[eid] = null;

            else if (isInRange && updatedEntities.has(eid))
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind, w:e.worldId};
                // TODO [MEDIUM] manage transition several world ids.
        }});

        removedPlayers.forEach(eid => {
            if (consistencyModel.hasEntity(aid, eid))
                removedEntities[eid] = null;
        });

        return [addedEntities, removedEntities];
    }
}

export default EntityLoader;
