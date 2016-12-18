/**
 * Load and prepare chunks for players.
 */

'use strict';

class Loader {

    constructor(consistencyEngine) {
        this._entityModel = consistencyEngine.entityModel;
    }

    computeEntitiesInRange(player) {
        let modelEntities = this._entityModel.entities;

        var entities = [];
        for (var eid in modelEntities) {
            if (modelEntities[eid]._id === player.avatar._id) continue;

            let entity = modelEntities[eid];
            entities.push({p:entity.position, r:entity.rotation, k:entity.kind});
        }
        return entities;
    }

}

export default Loader;
