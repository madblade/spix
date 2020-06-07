/**
 *
 */

'use strict';

class XBuffer
{
    constructor()
    {
        // Don't implement add/removeX
        // For they'll be updated next frame.
        // Should do same with players :/

        this._outputBuffer = new Map();
    }

    updateXForPlayer(playerId, addedX, removedX)
    {
        if (!(addedX && Object.keys(addedX).length > 0) &&
            !(removedX && Object.keys(removedX).length > 0))
            return;

        if (addedX && Object.keys(addedX).length > 0 && removedX && Object.keys(removedX).length > 0)
            Object.assign(addedX, removedX);
        else if (removedX && Object.keys(removedX).length > 0)
            addedX = removedX;

        this._outputBuffer.set(playerId, addedX);
    }

    getOutput()
    {
        return new Map(this._outputBuffer);
    }

    flush()
    {
        this._outputBuffer = new Map();
    }
}

export default XBuffer;
