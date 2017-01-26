/**
 * Transform and operate chunks.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _updater_access = require('./updater_access');

var _updater_access2 = _interopRequireDefault(_updater_access);

var _updater_block = require('./updater_block');

var _updater_block2 = _interopRequireDefault(_updater_block);

var _updater_face = require('./updater_face');

var _updater_face2 = _interopRequireDefault(_updater_face);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Updater = function () {
    function Updater(topologyEngine) {
        (0, _classCallCheck3.default)(this, Updater);

        // Models.
        this._worldModel = topologyEngine.worldModel;
        this._entityModel = topologyEngine.entityModel;

        this._outputBuffer = topologyEngine.outputBuffer;
    }

    (0, _createClass3.default)(Updater, [{
        key: 'update',
        value: function update(inputBuffer) {
            var _this = this;

            inputBuffer.forEach(function (input) {
                var data = input[0];
                var avatar = input[1];
                var worldId = avatar.worldId;
                if (!worldId) return; // Avatar was disconnected between input & update.

                var meta = data.meta;
                var action = meta[0];

                // Manage block addition.
                if (action === "add") {
                    _this.addBlock(avatar, meta[1], meta[2], meta[3], meta[4]);
                } else if (action === "del") {
                    _this.delBlock(avatar, meta[1], meta[2], meta[3]);
                }
            });
        }
    }, {
        key: 'addBlock',
        value: function addBlock(avatar, x, y, z, blockId) {
            var worldId = avatar.worldId;
            var world = this._worldModel.getWorld(worldId);
            var o = this._outputBuffer;
            var em = this._entityModel;

            var a = _updater_access2.default.addBlock(avatar, x, y, z, blockId, world, em);
            if (!a) return;

            var $chunk = void 0,
                $x = void 0,
                $y = void 0,
                $z = void 0,
                $blockId = void 0;

            var _a = (0, _slicedToArray3.default)(a, 5);

            $chunk = _a[0];
            $x = _a[1];
            $y = _a[2];
            $z = _a[3];
            $blockId = _a[4];


            var $id = $chunk.add($x, $y, $z, $blockId);
            _updater_block2.default.updateSurfaceBlocksAfterAddition($chunk, $id, $x, $y, $z);
            var updatedChunks = _updater_face2.default.updateSurfaceFacesAfterAddition($chunk, $id, $x, $y, $z);

            // Push updates.
            updatedChunks.forEach(function (c) {
                return o.chunkUpdated(worldId, c.chunkId);
            });
            o.chunkUpdated(worldId, $chunk.chunkId);
        }
    }, {
        key: 'delBlock',
        value: function delBlock(avatar, x, y, z) {
            var worldId = avatar.worldId;
            var world = this._worldModel.getWorld(worldId);
            var o = this._outputBuffer;
            var em = this._entityModel;

            var a = _updater_access2.default.delBlock(avatar, x, y, z, world, em);
            if (!a) return;

            var $chunk = void 0,
                $x = void 0,
                $y = void 0,
                $z = void 0;

            var _a2 = (0, _slicedToArray3.default)(a, 4);

            $chunk = _a2[0];
            $x = _a2[1];
            $y = _a2[2];
            $z = _a2[3];


            var $id = $chunk.del($x, $y, $z);
            _updater_block2.default.updateSurfaceBlocksAfterDeletion($chunk, $id, $x, $y, $z);
            var updatedChunks = _updater_face2.default.updateSurfaceFacesAfterDeletion($chunk, $id, $x, $y, $z);

            // Push updates.
            updatedChunks.forEach(function (c) {
                return o.chunkUpdated(worldId, c.chunkId);
            });
            o.chunkUpdated(worldId, $chunk.chunkId);
        }
    }]);
    return Updater;
}();

exports.default = Updater;
//# sourceMappingURL=updater.js.map
