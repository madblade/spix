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

        this._xIdsForEntity             = new Map();
        this._partialXs                 = new Map();
    }

    spawnPlayer(player) {
        let playerId = parseInt(player.avatar.entityId, 10);
        let chunksMap = new Map();
        chunksMap.set(player.avatar.worldId, new Set());

        this._entityIdsForEntity.set(playerId,          new Set());
        this._chunkIdsForEntity.set(playerId,           chunksMap);
        this._chunkIdAndPartsForEntity.set(playerId,    new Map()); // TODO [LOW] think

        this._xIdsForEntity.set(playerId,               new Set());
        this._partialXs.set(playerId,                   new Set());
    }

    removePlayer(playerId) {
        playerId = parseInt(playerId, 10);
        this._entityIdsForEntity.delete(playerId);
        this._chunkIdsForEntity.delete(playerId);
        this._chunkIdAndPartsForEntity.delete(playerId);

        this._xIdsForEntity.delete(playerId);
        this._partialXs.delete(playerId);
    }

    /** Entity to chunks **/

    chunkIdsPerWorldForEntity(playerId) {
        playerId = parseInt(playerId, 10);

        return this._chunkIdsForEntity.get(playerId);
    }

    hasChunk(playerId, worldId, chunkId) {
        playerId = parseInt(playerId, 10);
        worldId = parseInt(worldId, 10);

        let chunkIdsForEntityInWorld = this._chunkIdsForEntity.get(playerId).get(worldId);
        return chunkIdsForEntityInWorld && chunkIdsForEntityInWorld.has(chunkId);
    }

    setChunkLoaded(playerId, worldId, chunkId) {
        // Just in case.
        playerId = parseInt(playerId, 10);
        worldId = parseInt(worldId, 10);

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
        playerId = parseInt(playerId, 10);
        worldId = parseInt(worldId, 10);

        let chunksForPlayerInWorld = this._chunkIdsForEntity.get(playerId).get(worldId);
        chunksForPlayerInWorld.delete(chunkId);
    }

    doneChunkLoadingPhase(player, starterChunk) {
        let avatar = player.avatar;
        let renderDistance = avatar.chunkRenderDistance;
        let worldId = avatar.worldId;

        let side = renderDistance * 2 + 1;

        // TODO [CRIT] worldify (with xModel.getConnectivity)
        let aid = avatar.entityId;
        let worlds = this._chunkIdsForEntity.get(aid);

        let chunks = worlds.get(worldId);
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
        const expectedSize = side *  side * side;

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

    /** Entity to xs **/

    getXIdsForEntity(entityId) {
        return this._xIdsForEntity.get(entityId);
    }

    // Note: it would not have been wise to consider an x as an 'entity'.
    // ENHANCEMENT [LONG-TERM]: can an x move over time?
    hasX(playerId, xId) {
        xId = parseInt(xId, 10);
        return this._xIdsForEntity.get(playerId).has(xId);
    }

    setXLoaded(playerId, xId) {
        xId = parseInt(xId, 10);
        this._xIdsForEntity.get(playerId).add(xId);
    }

    setXOutOfRange(playerId, xId) {
        xId = parseInt(xId, 10);
        this._xIdsForEntity.get(playerId).delete(xId);
    }

    setPartialX(playerId, xId) {
        xId = parseInt(xId, 10);
        this._partialXs.get(playerId).add(xId);
    }

    unsetPartialX(playerId, xId) {
        xId = parseInt(xId, 10);
        this._partialXs.get(playerId).delete(xId);
    }

    isPartialX(playerId, xId) {
        xId = parseInt(xId, 10);
        let p = this._partialXs.get(playerId);
        if (!p) return false;
        return p.has(xId);
    }

}

export default ConsistencyModel;
