/**
 *
 */

'use strict';

class ChunkBuffer
{
    constructor()
    {
        this._outputBuffer = new Map();
    }

    // addedChunks:     world id => chunk id => [fast components, fast component ids]
    //     on the first: world metadata (type, radius, center.xyz)
    // removedChunks:   world id => chunk id => null
    // updatedChunks:   (topologyEngine)
    updateChunksForPlayer(
        playerId,
        addedChunks, removedChunks, addedWorlds, addedWorldsMeta
    )
    {
        // Check.
        if (!(addedChunks && Object.keys(addedChunks).length > 0) &&
            !(removedChunks && Object.keys(removedChunks).length > 0))
            return;

        // Aggregate.
        if (addedChunks && Object.keys(addedChunks).length > 0 &&
            removedChunks && Object.keys(removedChunks).length > 0)
        {
            for (let propA in addedChunks) {
                if (propA in removedChunks) {
                    Object.assign(addedChunks[propA], removedChunks[propA]); // Not the same cid to add & delete.
                    delete removedChunks[propA];
                }
            }

            // After deleting everything in common with removedChunks, can safely assign the remainder.
            Object.assign(addedChunks, removedChunks);
        }
        else if (removedChunks && Object.keys(removedChunks).length > 0)
            addedChunks = removedChunks;

        if (addedWorlds) addedChunks.worlds = addedWorlds;
        if (addedWorldsMeta) addedChunks.worldsMeta = addedWorldsMeta;

        // Output.
        this._outputBuffer.set(playerId, addedChunks);
    }

    // Shallow.
    getOutput()
    {
        // TODO [PERF] remove copy
        return new Map(this._outputBuffer);
    }

    flush()
    {
        this._outputBuffer = new Map();
    }
}

export default ChunkBuffer;
