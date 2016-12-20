/**
 * Aggregate entity updates.
 */

'use strict';

class OutputBuffer {

    constructor() {
        this._buffer = new Set();
    }

    // Shallow.
    getOutput() {
        return new Set(this._buffer);
    }

}

export default OutputBuffer;
