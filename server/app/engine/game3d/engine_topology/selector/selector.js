/**
 * Ensure player model consistency.
 */

'use strict';

class Selector {

    constructor(topologyEngine) {
        this._accessor    = topologyEngine.accessor;
    }

    // TODO [LOW] distance test.
    // TODO [CRIT] worldify
    // TODO [CRIT] worldify
    // TODO [CRIT] worldify
    selectUpdatedChunksForPlayer(player, worldModel, consistencyModel,
                                 modelUpdatedChunks,    // topology output      Map(world id -> set of updtd chks)
                                 addedOrDeletedChunks   // consistency output   {world id => {cid => [fc, fcids]} }
    ) {
        if (!this.playerConcernedByUpdatedChunks(player, modelUpdatedChunks)) return;

        var chunksForPlayer = {};
        let aid = player.avatar.id;
        // var chunks = worldModel.allChunks;

        modelUpdatedChunks.forEach((chunkIdSet, worldId) => {
            let world = worldModel.getWorld(worldId);
            let addedOrDeletedChunksInWorld;
            if (addedOrDeletedChunks) addedOrDeletedChunksInWorld = addedOrDeletedChunks[worldId];

            chunkIdSet.forEach(chunkId => {
                if (!world.hasChunkById(chunkId)) return;

                if (!consistencyModel.hasChunk(aid, worldId, chunkId) ||
                    // not null, has {chunkId: !null}
                    (addedOrDeletedChunksInWorld && addedOrDeletedChunksInWorld.hasOwnProperty(chunkId) && addedOrDeletedChunksInWorld[chunkId]
                    )) {
                    // At this point, topology output is being accessed.
                    // So, topology engine has updated and therefore its topology model is up-to-date.
                    // Therefore, there is no need to access updates concerning non-loaded chunks,
                    // for full, up-to-date, extracted surfaces are available to consistencyEngine.
                    // (reminder: updates are kept for lazy server-client communication)
                    // (reminder: consistencyEngine does not update before topologyEngine performs model transactions)
                    return;
                }

                let currentChunk = world.getChunkById(chunkId);
                if (chunksForPlayer.hasOwnProperty(worldId)) {
                    chunksForPlayer[worldId][currentChunk.chunkId]= currentChunk.updates;
                } else {
                    chunksForPlayer[worldId] = {[currentChunk.chunkId]: currentChunk.updates};
                }
            });
        });
        //
        //modelUpdatedChunks.forEach(chunkId => {
        //    if (!worldModel.has(chunkId)) return;
        //
        //    if (!consistencyModel.hasChunk(player.avatar.id, chunkId) || // TODO [CRIT] worldify
        //            // not null, has {chunkId: !null}
        //        (addedOrDeletedChunks && addedOrDeletedChunks.hasOwnProperty(chunkId) && addedOrDeletedChunks[chunkId])) {
        //        // At this point, topology output is being accessed.
        //        // So, topology engine has updated and therefore its topology model is up-to-date.
        //        // Therefore, there is no need to access updates concerning non-loaded chunks,
        //        // for full, up-to-date, extracted surfaces are available to consistencyEngine.
        //        // (reminder: updates are kept for lazy server-client communication)
        //        // (reminder: consistencyEngine does not update before topologyEngine performs model transactions)
        //        return;
        //    }
        //
        //    let currentChunk = worldModel.get(chunkId);
        //    chunksForPlayer[currentChunk.chunkId] = currentChunk.updates; // TODO [LOW] Map
        //});

        return chunksForPlayer;
    }

    playerConcernedByUpdatedChunks(player, chunks) {
        // TODO [MEDIUM] extract connected subsurface.
        return (chunks.size > 0);
    }

}

export default Selector;
