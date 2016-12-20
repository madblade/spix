/**
 * Manage input transactions.
 * Specialized for world model.
 */

'use strict';

class InputBuffer {

    constructor() {
        this._buffer = [];
    }

    addInput(avatar, meta) {
        this._buffer.push([avatar, meta]);
    }

    getInput() {
        return this._buffer;
    }

    flush() {
        this._buffer = [];
    }

}

export default InputBuffer;
