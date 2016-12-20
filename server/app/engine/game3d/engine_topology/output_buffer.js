/**
 * Aggregate updates.
 * Specialized for world model.
 */

'use strict';

class OutputBuffer {

    constructor() {
        this._buffer = new Set();
    }

    get buffer() {
        return this._buffer;
    }

    chunkUpdated(chunkId) {
        this._buffer.add(chunkId);
    }

    // Shallow copy.
    getOutput(modelChunks) {
        var updatedChunks = new Map();

        // TODO only store ids (topology engine -> helper).
        this._buffer.forEach(
            id => updatedChunks.set(id, modelChunks.get(id).blocks)
        );

        return updatedChunks;
    }

    flushOutput(modelChunks) {
        this._buffer.forEach(
            id => modelChunks.get(id).flushUpdates()
        );

        this._buffer = new Set();
    }

}

export default OutputBuffer;
