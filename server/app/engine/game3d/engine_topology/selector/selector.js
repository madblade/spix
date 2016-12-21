/**
 * Ensure player model consistency.
 */

'use strict';

class Selector {

    constructor(topologyEngine) {
        this._accessor    = topologyEngine.accessor;
    }

    // TODO [MEDIUM] distance test
    selectUpdatedChunksForPlayer(player, modelChunks, modelUpdatedChunks, modelNewChunks, consistencyModel) {
        if (!this.playerConcernedByUpdatedChunks(player, modelUpdatedChunks)) return;

        var chunksForPlayer = {};

        modelUpdatedChunks.forEach(id => {
            if (!modelChunks.has(id)) return;

            // TODO [CRIT] move isChunkLoaded.
            if (!player.avatar.isChunkLoaded(id) ||
                (modelNewChunks && modelNewChunks.hasOwnProperty(id))) {
                // At this point, topology output is being accessed.
                // So, topology engine has updated and therefore its topology model is up-to-date.
                // Therefore, there is no need to access updates concerning non-loaded chunks,
                // for full, up-to-date, extracted surfaces are available to consistencyEngine.
                // (reminder: updates are kept for lazy server-client communication)
                // (reminder: consistencyEngine does not update before topologyEngine performs model transactions)
                return;
            }

            let currentChunk = modelChunks.get(id);
            chunksForPlayer[currentChunk.chunkId] = currentChunk.updates; // TODO [LOW] Map
        });

        return chunksForPlayer;
    }

    playerConcernedByUpdatedChunks(player, chunks) {
        // TODO extract connected subsurface.
        return (chunks.size > 0);
    }

}

export default Selector;
