/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ChunkBuffer = function () {
    function ChunkBuffer() {
        (0, _classCallCheck3.default)(this, ChunkBuffer);

        this._outputBuffer = new _map2.default();
    }

    // addedChunks:     world id => chunk id => [fast components, fast component ids]
    // removedChunks:   world id => chunk id => null
    // updatedChunks:   (topologyEngine)


    (0, _createClass3.default)(ChunkBuffer, [{
        key: 'updateChunksForPlayer',
        value: function updateChunksForPlayer(playerId, addedChunks, removedChunks, addedWorlds) {
            // Check.
            if (!addedChunks && !removedChunks) return;

            // Aggregate.
            if (addedChunks && removedChunks) {
                for (var propA in addedChunks) {
                    if (propA in removedChunks) {
                        (0, _assign2.default)(addedChunks[propA], removedChunks[propA]); // Not the same cid to add & delete.
                        delete removedChunks[propA];
                    }
                }

                // After deleting everything in common with removedChunks, can safely assign the remainder.
                (0, _assign2.default)(addedChunks, removedChunks);
            } else if (removedChunks) addedChunks = removedChunks;

            if (addedWorlds) addedChunks['worlds'] = addedWorlds;

            // Output.
            this._outputBuffer.set(playerId, addedChunks);
        }

        // Shallow.

    }, {
        key: 'getOutput',
        value: function getOutput() {
            return new _map2.default(this._outputBuffer);
        }
    }, {
        key: 'flush',
        value: function flush() {
            this._outputBuffer = new _map2.default();
        }
    }]);
    return ChunkBuffer;
}();

exports.default = ChunkBuffer;
//# sourceMappingURL=buffer_chunk.js.map
