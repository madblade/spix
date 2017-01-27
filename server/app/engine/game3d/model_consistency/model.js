/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _geometry = require('../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ConsistencyModel = function () {
    function ConsistencyModel(game) {
        (0, _classCallCheck3.default)(this, ConsistencyModel);

        // Model.
        this._worldModel = game.worldModel;
        this._entityModel = game.entityModel;
        this._xModel = game.xModel;

        // Internals.
        this._entityIdsForEntity = new _map2.default();
        this._chunkIdsForEntity = new _map2.default();
        this._chunkIdAndPartsForEntity = new _map2.default();

        this._xIdsForEntity = new _map2.default();
        this._partialXs = new _map2.default();
    }

    (0, _createClass3.default)(ConsistencyModel, [{
        key: 'spawnPlayer',
        value: function spawnPlayer(player) {
            var playerId = player.avatar.id;
            var chunksMap = new _map2.default();
            chunksMap.set(player.avatar.worldId, new _set2.default());

            this._entityIdsForEntity.set(playerId, new _set2.default());
            this._chunkIdsForEntity.set(playerId, chunksMap);
            this._chunkIdAndPartsForEntity.set(playerId, new _map2.default()); // TODO [LOW] think

            this._xIdsForEntity.set(playerId, new _set2.default());
            this._partialXs.set(playerId, new _set2.default());
        }
    }, {
        key: 'removePlayer',
        value: function removePlayer(playerId) {
            this._entityIdsForEntity.delete(playerId);
            this._chunkIdsForEntity.delete(playerId);
            this._chunkIdAndPartsForEntity.delete(playerId);

            this._xIdsForEntity.delete(playerId);
            this._partialXs.delete(playerId);
        }

        /** Entity to chunks **/

    }, {
        key: 'chunkIdsPerWorldForEntity',
        value: function chunkIdsPerWorldForEntity(playerId) {
            playerId = parseInt(playerId);

            return this._chunkIdsForEntity.get(playerId);
        }
    }, {
        key: 'hasChunk',
        value: function hasChunk(playerId, worldId, chunkId) {
            playerId = parseInt(playerId);
            worldId = parseInt(worldId);

            var chunkIdsForEntityInWorld = this._chunkIdsForEntity.get(playerId).get(worldId);
            return chunkIdsForEntityInWorld && chunkIdsForEntityInWorld.has(chunkId);
        }
    }, {
        key: 'setChunkLoaded',
        value: function setChunkLoaded(playerId, worldId, chunkId) {
            // Just in case.
            playerId = parseInt(playerId);
            worldId = parseInt(worldId);

            var chunksForPlayer = this._chunkIdsForEntity.get(playerId);
            if (chunksForPlayer.has(worldId)) {
                chunksForPlayer.get(worldId).add(chunkId);
            } else {
                var s = new _set2.default();
                s.add(chunkId);
                chunksForPlayer.set(worldId, s);
            }
        }
    }, {
        key: 'setChunkOutOfRange',
        value: function setChunkOutOfRange(playerId, worldId, chunkId) {
            playerId = parseInt(playerId);
            worldId = parseInt(worldId);

            var chunksForPlayerInWorld = this._chunkIdsForEntity.get(playerId).get(worldId);
            chunksForPlayerInWorld.delete(chunkId);
        }
    }, {
        key: 'doneChunkLoadingPhase',
        value: function doneChunkLoadingPhase(player, starterChunk) {
            var avatar = player.avatar;
            var renderDistance = avatar.chunkRenderDistance;
            var worldId = avatar.worldId;

            var side = renderDistance * 2 + 1;

            // TODO [CRIT] worldify (with xModel.getConnectivity)
            var worlds = this._chunkIdsForEntity.get(avatar.id);

            var chunks = this._chunkIdsForEntity.get(avatar.id).get(worldId);
            if (!chunks) return false;

            var actualInnerSize = 0;
            var distance = _geometry2.default.infiniteNormDistance;

            var sijk = starterChunk.chunkId.split(',');
            chunks.forEach(function (chunkId) {
                var ijk = chunkId.split(',');
                if (distance(sijk, ijk) <= renderDistance) {
                    actualInnerSize++;
                }
            });

            // TODO [HIGH] differentiate 3D / 2D.
            var expectedSize = side * side * side;

            return expectedSize <= actualInnerSize;
        }

        /** Entity to entities **/

        // TODO [CRIT] worldify entities

    }, {
        key: 'hasEntity',
        value: function hasEntity(playerId, entityId) {
            return this._entityIdsForEntity.get(playerId).has(entityId);
        }
    }, {
        key: 'setEntityLoaded',
        value: function setEntityLoaded(playerId, entityId) {
            this._entityIdsForEntity.get(playerId).add(entityId);
        }
    }, {
        key: 'setEntityOutOfRange',
        value: function setEntityOutOfRange(playerId, entityId) {
            this._entityIdsForEntity.get(playerId).delete(entityId);
        }

        /** Entity to xs **/

    }, {
        key: 'getXIdsForEntity',
        value: function getXIdsForEntity(entityId) {
            return this._xIdsForEntity.get(entityId);
        }

        // Note: it would not have been wise to consider an x as an 'entity'.
        // ENHANCEMENT [LONG-TERM]: can an x move over time?

    }, {
        key: 'hasX',
        value: function hasX(playerId, xId) {
            xId = parseInt(xId);
            return this._xIdsForEntity.get(playerId).has(xId);
        }
    }, {
        key: 'setXLoaded',
        value: function setXLoaded(playerId, xId) {
            xId = parseInt(xId);
            this._xIdsForEntity.get(playerId).add(xId);
        }
    }, {
        key: 'setXOutOfRange',
        value: function setXOutOfRange(playerId, xId) {
            xId = parseInt(xId);
            this._xIdsForEntity.get(playerId).delete(xId);
        }
    }, {
        key: 'setPartialX',
        value: function setPartialX(playerId, xId) {
            xId = parseInt(xId);
            this._partialXs.get(playerId).add(xId);
        }
    }, {
        key: 'unsetPartialX',
        value: function unsetPartialX(playerId, xId) {
            xId = parseInt(xId);
            this._partialXs.get(playerId).delete(xId);
        }
    }, {
        key: 'isPartialX',
        value: function isPartialX(playerId, xId) {
            xId = parseInt(xId);
            var p = this._partialXs.get(playerId);
            if (!p) return false;
            return p.has(xId);
        }
    }]);
    return ConsistencyModel;
}();

exports.default = ConsistencyModel;
//# sourceMappingURL=model.js.map
