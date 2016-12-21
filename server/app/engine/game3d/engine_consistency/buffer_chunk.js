/**
 *
 */

'use strict';

class ChunkBuffer {

    constructor() {
        this._outputBuffer = new Map();
    }

    // addedChunks:     chunk id => [fast components, fast component ids]
    // removedChunks:   chunk id => null
    updateChunksForPlayer(playerId, addedChunks, removedChunks) {
        // Check.
        if (!addedChunks && !removedChunks) return;
        if (addedChunks && removedChunks) Object.assign(addedChunks, removedChunks); // Aggregate.
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
