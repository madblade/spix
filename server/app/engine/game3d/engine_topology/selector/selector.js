/**
 * Ensure player model consistency.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Selector = function () {
    function Selector(topologyEngine) {
        (0, _classCallCheck3.default)(this, Selector);
    }

    (0, _createClass3.default)(Selector, [{
        key: 'selectUpdatedChunksForPlayer',
        value: function selectUpdatedChunksForPlayer(player, worldModel, consistencyModel, modelUpdatedChunks, // topology output      Map(world id -> set of updtd chks)
        addedOrDeletedChunks // consistency output   {world id => {cid => [fc, fcids]} }
        ) {
            if (!this.playerConcernedByUpdatedChunks(player, modelUpdatedChunks)) return;

            var chunksForPlayer = {};
            var aid = player.avatar.id;

            modelUpdatedChunks.forEach(function (chunkIdSet, worldId) {
                var world = worldModel.getWorld(worldId);
                var addedOrDeletedChunksInWorld = void 0;
                if (addedOrDeletedChunks) addedOrDeletedChunksInWorld = addedOrDeletedChunks[worldId];

                chunkIdSet.forEach(function (chunkId) {
                    if (!world.hasChunkById(chunkId)) return;

                    if (!consistencyModel.hasChunk(aid, worldId, chunkId) ||
                    // not null, has {chunkId: !null}
                    addedOrDeletedChunksInWorld && addedOrDeletedChunksInWorld.hasOwnProperty(chunkId) && addedOrDeletedChunksInWorld[chunkId]) {
                        // At this point, topology output is being accessed.
                        // So, topology engine has updated and its topology model is up-to-date.
                        // Therefore, there is no need to access updates concerning non-loaded chunks,
                        // for full, up-to-date, extracted surfaces are available to consistencyEngine.
                        // (reminder: updates are kept for lazy server-client communication)
                        // (reminder: consistencyEngine does not update before topologyEngine performs model transactions)
                        return;
                    }

                    var currentChunk = world.getChunkById(chunkId);
                    if (chunksForPlayer.hasOwnProperty(worldId)) {
                        chunksForPlayer[worldId][currentChunk.chunkId] = currentChunk.updates;
                    } else {
                        chunksForPlayer[worldId] = (0, _defineProperty3.default)({}, currentChunk.chunkId, currentChunk.updates);
                    }
                });
            });

            return chunksForPlayer;
        }
    }, {
        key: 'playerConcernedByUpdatedChunks',
        value: function playerConcernedByUpdatedChunks(player, chunks) {
            // TODO [LOW] extract connected subsurface.
            return chunks.size > 0;
        }
    }]);
    return Selector;
}();

exports.default = Selector;
//# sourceMappingURL=selector.js.map
