/**
 *
 */

'use strict';

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
        this._entityIdsForEntity        .set(playerId, new Set());
        this._chunkIdsForEntity         .set(playerId, new Set());
        this._chunkIdAndPartsForEntity  .set(playerId, new Map());
    }

    removePlayer(player) {
        let playerId = player.avatar.id;
        this._entityIdsForEntity        .delete(playerId);
        this._chunkIdsForEntity         .delete(playerId);
        this._chunkIdAndPartsForEntity  .delete(playerId);
    }

    hasChunk(playerId, chunkId) {
        return this._chunkIdsForEntity.get(playerId).has(chunkId);
    }

    setChunkLoaded(playerId, chunkId) {
        this._chunkIdsForEntity.get(playerId).add(chunkId);
    }

    setChunkOutOfRange(playerId, chunkId) {
        this._chunkIdsForEntity.get(playerId).delete(chunkId);
    }

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
