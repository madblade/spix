/**
 * Load and prepare chunks for players.
 */

'use strict';

class Loader {

    constructor(consistencyEngine) {
        this._entityModel = consistencyEngine.entityModel;
    }

    // Squared Euclidean distance.
    static distance(entityX, entityY) {
        let result = 0; let d;
        let pX = entityX.position, pY = entityY.position;
        for (let i = 0; i<3; ++i) { d = pX[i]-pY[i]; result += d*d; }
        return result;
    };

    computeEntitiesInRange(player) {
        let modelEntities = this._entityModel.entities;
        let avatar = player.avatar;
        let aid = avatar.id;
        var entities = {};

        let thresh = avatar.entityRenderDistance;
        let distance = Loader.distance;

        this._entityModel.forEach(e => { let eid = e.id; if (eid !== aid) {
            if (distance(e, avatar) < thresh)
                entities[eid] = {p:e.position, r:e.rotation, k:e.kind};
        }});

        return entities;
    }

    computeNewEntitiesInRange(player, consistencyModel, updatedEntities, addedPlayers, removedPlayers) {
        let modelEntities = this._entityModel.entities;
        let avatar = player.avatar;
        let thresh = avatar.entityRenderDistance;

        let distance = Loader.distance;

        var addedEntities = {};
        var removedEntities = {};

        // TODO [MEDIUM]: use LACKS structure to pass from O(n²) to O(Cn).
        // TODO [MEDIUM]: also use for AABB phase in physics.
        let aid = avatar.id;
        this._entityModel.forEach(e => { let eid = e.id; if (eid !== aid) { // For all different entities.

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

        // TODO [CRIT] extensively test.
        return [addedEntities, removedEntities];
    }
}

export default Loader;
