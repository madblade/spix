/**
 *
 */

'use strict';

import GeometryUtils    from '../../math/geometry';

class ConsistencyModel {

    constructor(game) {
        // Model.
        this._worldModel                = game.worldModel;
        this._entityModel               = game.entityModel;
        this._xModel                    = game.xModel;

        // Internals.
        this._entityIdsForEntity        = new Map();
        this._chunkIdsForEntity         = new Map();
        this._chunkIdAndPartsForEntity  = new Map();
    }

    spawnPlayer(player) {
        let playerId = player.avatar.id;
        let chunksMap = new Map();
        chunksMap.set(player.avatar.worldId, new Set());

        this._entityIdsForEntity        .set(playerId, new Set());
        this._chunkIdsForEntity         .set(playerId, chunksMap);
        this._chunkIdAndPartsForEntity  .set(playerId, new Map()); // TODO [HIGH] think
    }

    removePlayer(playerId) {
        this._entityIdsForEntity        .delete(playerId);
        this._chunkIdsForEntity         .delete(playerId);
        this._chunkIdAndPartsForEntity  .delete(playerId);
    }

    /** Entity to chunks **/

    chunkIdsPerWorldForEntity(playerId) {
        playerId = parseInt(playerId);

        return this._chunkIdsForEntity.get(playerId);
    }

    hasChunk(playerId, worldId, chunkId) {
        playerId = parseInt(playerId);
        worldId = parseInt(worldId);

        let chunkIdsForEntityInWorld = this._chunkIdsForEntity.get(playerId).get(worldId);
        return (chunkIdsForEntityInWorld && chunkIdsForEntityInWorld.has(chunkId));
    }

    setChunkLoaded(playerId, worldId, chunkId) {
        // Just in case.
        playerId = parseInt(playerId);
        worldId = parseInt(worldId);

        let chunksForPlayer = this._chunkIdsForEntity.get(playerId);
        if (chunksForPlayer.has(worldId)) {
            chunksForPlayer.get(worldId).add(chunkId);
        } else {
            let s = new Set();
            s.add(chunkId);
            chunksForPlayer.set(worldId, s);
        }
    }

    setChunkOutOfRange(playerId, worldId, chunkId) {
        playerId = parseInt(playerId);
        worldId = parseInt(worldId);

        let chunksForPlayerInWorld = this._chunkIdsForEntity.get(playerId).get(worldId);
        chunksForPlayerInWorld.delete(chunkId);
    }

    doneChunkLoadingPhase(player, starterChunk) {
        let avatar = player.avatar;
        let renderDistance = avatar.chunkRenderDistance;
        let worldId = avatar.worldId;

        let side = renderDistance*2 + 1;
        let chunks = this._chunkIdsForEntity.get(avatar.id).get(worldId);
        if (!chunks) return false;

        let actualInnerSize = 0;
        let distance = GeometryUtils.infiniteNormDistance;

        let sijk = starterChunk.chunkId.split(',');
        chunks.forEach(chunkId => {
            let ijk = chunkId.split(',');
            if (distance(sijk, ijk) <= renderDistance) {
                actualInnerSize++;
            }
        });

        // TODO [HIGH] differentiate 3D / 2D.
        const expectedSize = side*side*side;

        return expectedSize <= actualInnerSize;
    }

    /** Entity to entities **/

    // TODO [CRIT] worldify entities
    hasEntity(playerId, entityId) {
        return this._entityIdsForEntity.get(playerId).has(entityId);
    }

    setEntityLoaded(playerId, entityId) {
        this._entityIdsForEntity.get(playerId).add(entityId);
    }

    setEntityOutOfRange(playerId, entityId) {
        this._entityIdsForEntity.get(playerId).delete(entityId);
    }

}

export default ConsistencyModel;
