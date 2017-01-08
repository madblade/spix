/**
 *
 */

'use strict';

class XBuffer {

    constructor() {
        // Don't implement add/removeX
        // For they'll be updated next frame.
        // Should do same with players :/

        this._outputBuffer = new Map();
    }

    updateXForPlayer(playerId, addedX, removedX) {
        if (!addedX && !removedX) return;

        if (addedX && removedX) Object.assign(addedX, removedX);
        else if (removedX) addedX = removedX;

        this._outputBuffer.set(playerId, addedX);
    }

    getOutput() {
        return new Map(this._outputBuffer);
    }

    flush() {
        this._outputBuffer = new Map();
    }

}

export default XBuffer;
