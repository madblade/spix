/**
 * Aggregate updates.
 * Specialized for world model.
 */

'use strict';

class OutputBuffer
{
    constructor()
    {
        // Contains ids of updated chunks.
        // Chunks themselves hold information about their being updated.
        // TODO [PERF] concentrate chunk updates in this buffer.
        // world id => Set(... chunk ids)
        this._buffer = new Map();
    }

    chunkUpdated(worldId, chunkId)
    {
        let worldSet = this._buffer.get(worldId);
        if (worldSet) {
            worldSet.add(chunkId);
        } else {
            let chunkIdSet = new Set();
            chunkIdSet.add(chunkId);
            this._buffer.set(worldId, chunkIdSet);
        }
    }

    // Shallow copy.
    getOutput()
    {
        return new Map(this._buffer);
    }

    flushOutput(worldModel)
    {
        let buffer = this._buffer;

        buffer.forEach((chunkSet, worldId) => {
            let chunks = worldModel.getWorld(worldId).allChunks;
            chunkSet.forEach(
                id => chunks.get(id).flushUpdates()
            );
        });

        this._buffer = new Map();
    }
}

export default OutputBuffer;
