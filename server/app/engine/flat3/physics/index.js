/**
 *
 */

'use strict';

class Physics {

    constructor(entityman, worldman) {
        this._entityman = entityman;
        this._worldman = worldman;
    }

    update() {
        let entityManager = this._entityman;
        let worldManager = this._worldman;
        entityManager.forEach(function(entity) {
           entity.move(entityManager, worldManager);
        });

        // Get entities inputs
        // Compute forces on global fields
        // Compute forces on local fields

        // Solve movements
        // Compute entity collisions
        // Compute terrain collisions
        // Solve again

        // Update positions

        // Effects
        // Reverse time...

        // Future...
        // Update orientations
        // Manage fragmentation
    }

    // Or:
    // Sum fields.
    // Add terrain as field
    // Add player contribution
    // retest terrain as limit

}

export default Physics;
