/**
 *
 */

'use strict';

class ChunkBuffer {

    constructor() {
        this._outputBuffer = new Map();
    }

    // addedChunks:     world id => chunk id => [fast components, fast component ids]
    // removedChunks:   world id => chunk id => null
    // updatedChunks:   (topologyEngine)
    updateChunksForPlayer(playerId, addedChunks, removedChunks) {
        // Check.
        if (!addedChunks && !removedChunks) return;

        // Aggregate.
        if (addedChunks && removedChunks) {
            for (let propA in addedChunks) {
                if (propA in removedChunks) {
                    Object.assign(addedChunks[propA], removedChunks[propA]); // Not the same cid to add & delete.
                    delete removedChunks[propA];
                }
            }

            // After deleting everything in common with removedChunks, can safely assign the remainder.
            Object.assign(addedChunks, removedChunks);
        }
        else if (removedChunks) addedChunks = removedChunks;

        // Output.
        this._outputBuffer.set(playerId, addedChunks);
    }

    // Shallow.
    getOutput() {
        return new Map(this._outputBuffer);
    }

    flush() {
        this._outputBuffer = new Map();
    }

}

export default ChunkBuffer;
