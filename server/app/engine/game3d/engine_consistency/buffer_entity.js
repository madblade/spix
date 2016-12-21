/**
 *
 */

'use strict';

class EntityBuffer {

    constructor() {
        this._outputBuffer = new Map();
    }

    // addedEntities:   entity id => {p:e.position, r:e.rotation, k:e.kind}
    // removedEntities: entity id => null
    updateEntitiesForPlayer(playerId, addedEntities, removedEntities) {
        // Check.
        if (!addedEntities && !removedEntities) return;
        if (addedEntities && removedEntities) Object.assign(addedEntities, removedEntities); // Aggregate.
        else if (removedEntities) addedEntities = removedEntities;

        // Output.
        this._outputBuffer.set(playerId, addedEntities);
    }

    // Shallow.
    getOutput() {
        return new Map(this._outputBuffer);
    }

    flush() {
        this._outputBuffer = new Map();
    }

}

export default EntityBuffer;
