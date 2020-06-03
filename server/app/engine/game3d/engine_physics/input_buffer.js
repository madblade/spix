/**
 * Manage entity inputs.
 */

'use strict';

class InputBuffer
{
    constructor() {
        this._buffer = new Map();
    }

    addInput(meta, avatar) {
        let array = this._buffer.get(avatar);
        if (!array) this._buffer.set(avatar, [meta]);
        else array.push(meta);
    }

    getInput() {
        return this._buffer;
    }

    flush() {
        this._buffer = new Map();
    }
}

export default InputBuffer;
