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
        let distance = GeometryUtils.entitySquaredEuclideanDistance;

        entityModel.forEach(e => { let eid = e.id; if (eid !== aid) {
            if (distance(e, avatar) < thresh)
                entities[eid] = {p:e.position, r:e.rotation, k:e.kind};
        }});

        return entities;
    }

    computeNewEntitiesInRange(player, updatedEntities, addedPlayers, removedPlayers) {
        let entityModel = this._entityModel;
        let consistencyModel = this._consistencyModel;
        let avatar = player.avatar;
        let thresh = avatar.entityRenderDistance;
        thresh *= thresh; // Squared distance.
        // TODO [CRIT] worldify distance to knot then other world's player.

        let distance = GeometryUtils.entitySquaredEuclideanDistance;

        var addedEntities = {};
        var removedEntities = {};

        // TODO [MEDIUM]: use LACKS structure to pass from O(n²) to O(Cn).
        // TODO [MEDIUM]: also use for AABB phase in physics.
        let aid = avatar.id;
        entityModel.forEach(e => { let eid = e.id; if (eid !== aid) { // For all different entities.

            // Compute distance & find in OLD consistency model.
            let isInRange = distance(e, avatar) < thresh;
            let isPresent = consistencyModel.hasEntity(aid, eid); // TODO [PERF] n² log² n !!

            if (isInRange && !isPresent)
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind};

            else if (!isInRange && isPresent)
                removedEntities[eid] = null;

            else if (isInRange && updatedEntities.has(eid))
                addedEntities[eid] = {p:e.position, r:e.rotation, k:e.kind};
        }});

        removedPlayers.forEach(eid => {
            if (consistencyModel.hasEntity(aid, eid))
                removedEntities[eid] = null;
        });

        return [addedEntities, removedEntities];
    }
}

export default EntityLoader;
