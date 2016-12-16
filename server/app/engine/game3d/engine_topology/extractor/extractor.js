/**
 * Ensure player model consistency.
 */

'use strict';

class Extractor {

    constructor(topologyEngine) {
        this._accessor    = topologyEngine.accessor;
    }

    // TODO distance test, bring back extraction API
    extractUpdatedChunksForPlayer(player, modelChunks, modelUpdatedChunks) {
        if (!this.playerConcernedByUpdatedChunks(player, modelUpdatedChunks)) return;

        var chunksForPlayer = {};

        modelUpdatedChunks.forEach((chunk, id) => {
            if (!modelChunks.has(id) || !player.avatar.loadedChunks.has(id))
                return;

            let currentChunk = modelChunks.get(id);
            chunksForPlayer[currentChunk.chunkId] = currentChunk.updates; // TODO Map
        });

        return chunksForPlayer;
    }

    playerConcernedByUpdatedChunks(player, chunks) {
        // TODO extract connected subsurface.
        return (chunks.size > 0);
    }

}

export default Extractor;
