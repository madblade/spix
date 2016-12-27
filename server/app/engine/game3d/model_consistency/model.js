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

        //
        this.infiniteNormDistance = (pos1, pos2) => {
            var d = 0;
            for (let i = 0; i < 3; ++i)
                d = Math.max(d, Math.abs(parseInt(pos1[i]) - parseInt(pos2[i])));
            return d;
        }
    }

    spawnPlayer(player) {
        let playerId = player.avatar.id;
        this._entityIdsForEntity        .set(playerId, new Set());
        this._chunkIdsForEntity         .set(playerId, new Set());
        this._chunkIdAndPartsForEntity  .set(playerId, new Map());
    }

    removePlayer(playerId) {
        this._entityIdsForEntity        .delete(playerId);
        this._chunkIdsForEntity         .delete(playerId);
        this._chunkIdAndPartsForEntity  .delete(playerId);
    }

    /** Entity to chunks **/

    chunkIdsForEntity(playerId) {
        return this._chunkIdsForEntity.get(playerId);
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

    doneChunkLoadingPhase(player, starterChunk) {
        let avatar = player.avatar;
        let renderDistance = avatar.chunkRenderDistance;
        let side = renderDistance*2 + 1;
        let chunks = this._chunkIdsForEntity.get(avatar.id);
        let actualInnerSize = 0;
        let distance = this.infiniteNormDistance;

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
