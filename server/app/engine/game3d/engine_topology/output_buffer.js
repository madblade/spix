/**
 * Aggregate updates.
 * Specialized for world model.
 */

'use strict';

class OutputBuffer {

    constructor() {
        // Contains ids of updated chunks.
        // Chunks themselves hold information about their being updated.
        // TODO [LOW] concentrate chunk updates in this buffer.
        this._buffer = new Set();
    }

    chunkUpdated(chunkId) {
        this._buffer.add(chunkId);
    }

    // Shallow copy.
    getOutput() {
        return new Set(this._buffer);
    }

    flushOutput(modelChunks) {
        this._buffer.forEach(
            id => modelChunks.get(id).flushUpdates()
        );

        this._buffer = new Set();
    }

}

export default OutputBuffer;
