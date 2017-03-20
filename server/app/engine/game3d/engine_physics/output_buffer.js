/**
 * Aggregate entity updates.
 */

'use strict';

class OutputBuffer {

    constructor() {
        // Contains ids of updated entities.
        this._buffer = new Set();
    }

    entityUpdated(entityId) {
        this._buffer.add(entityId);
    }

    // Shallow.
    getOutput() {
        return new Set(this._buffer);
    }

    flushOutput() {
        this._buffer = new Set();
    }

}

export default OutputBuffer;
