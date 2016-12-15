/**
 * Aggregate updates.
 */

'use strict';

class OutputBuffer {

    constructor() {
        this._buffer = new Map();
    }

    getOutput() {
        return this._buffer();
    }

    flush() {
        this._buffer = new Map();
    }

}

export default OutputBuffer;
