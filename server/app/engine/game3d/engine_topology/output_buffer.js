/**
 * Aggregate updates.
 * Specialized for world model.
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OutputBuffer = function () {
    function OutputBuffer() {
        (0, _classCallCheck3.default)(this, OutputBuffer);

        // Contains ids of updated chunks.
        // Chunks themselves hold information about their being updated.
        // TODO [LOW] concentrate chunk updates in this buffer.
        // world id => Set(... chunk ids)
        this._buffer = new _map2.default();
    }

    (0, _createClass3.default)(OutputBuffer, [{
        key: 'chunkUpdated',
        value: function chunkUpdated(worldId, chunkId) {
            var worldSet = this._buffer.get(worldId);
            if (worldSet) {
                worldSet.add(chunkId);
            } else {
                var chunkIdSet = new _set2.default();
                chunkIdSet.add(chunkId);
                this._buffer.set(worldId, chunkIdSet);
            }
        }

        // Shallow copy.

    }, {
        key: 'getOutput',
        value: function getOutput() {
            return new _map2.default(this._buffer);
        }
    }, {
        key: 'flushOutput',
        value: function flushOutput(worldModel) {
            var buffer = this._buffer;

            buffer.forEach(function (chunkSet, worldId) {
                var chunks = worldModel.getWorld(worldId).allChunks;
                chunkSet.forEach(function (id) {
                    return chunks.get(id).flushUpdates();
                });
            });

            this._buffer = new _map2.default();
        }
    }]);
    return OutputBuffer;
}();

exports.default = OutputBuffer;
//# sourceMappingURL=output_buffer.js.map
