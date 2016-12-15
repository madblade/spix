/**
 * Aggregate updates.
 * Specialized for world model.
 */

'use strict';

class OutputBuffer {

    constructor() {
        this._buffer = new Map();
    }

    get buffer() {
        return this._buffer;
    }

    // Shallow copy.
    getOutput() {
        return new Map(this._buffer);
    }

    flush() {
        this._buffer = new Map();
    }

}

export default OutputBuffer;
