/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _collections = require('../../../math/collections');

var _collections2 = _interopRequireDefault(_collections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UpdaterBlock = function () {
    function UpdaterBlock() {
        (0, _classCallCheck3.default)(this, UpdaterBlock);
    }

    (0, _createClass3.default)(UpdaterBlock, null, [{
        key: 'removeSurfaceBlock',
        value: function removeSurfaceBlock(surfaceBlocks, chunk, x, y, z) {
            surfaceBlocks[z].splice(surfaceBlocks[z].indexOf(chunk._toId(x, y, z)));
        }
    }, {
        key: 'addSurfaceBlock',
        value: function addSurfaceBlock(surfaceBlocks, chunk, x, y, z) {
            var id = chunk._toId(x, y, z);
            if (!surfaceBlocks.hasOwnProperty(z)) surfaceBlocks[z] = [id];else _collections2.default.insert(id, surfaceBlocks[z]);
        }

        // The difficulty is to keep layered surfaceBlocks sorted.

    }, {
        key: 'updateSurfaceBlocksAfterAddition',
        value: function updateSurfaceBlocksAfterAddition(chunk, id, x, y, z) {
            var surfaceBlocks = chunk.surfaceBlocks;
            var dimensions = chunk.dimensions;
            var xp = false;var xm = false;
            var yp = false;var ym = false;
            var zp = false;var zm = false;

            // Update (x+1, x-1) blocks.
            if (x > 0) {
                if (chunk.contains(x - 1, y, z)) {
                    xm = true;
                    if ((y - 1 < 0 || chunk.contains(x - 1, y - 1, z)) && (y + 1 >= dimensions[1] || chunk.contains(x - 1, y + 1, z)) && (z - 1 < 0 || chunk.contains(x - 1, y, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x - 1, y, z + 1)) && (x - 2 < 0 || chunk.contains(x - 2, y, z))) UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x - 1, y, z);
                }
            }

            if (x < dimensions[0]) {
                if (chunk.contains(x + 1, y, z)) {
                    xp = true;
                    if ((y - 1 < 0 || chunk.contains(x + 1, y - 1, z)) && (y + 1 >= dimensions[1] || chunk.contains(x + 1, y + 1, z)) && (z - 1 < 0 || chunk.contains(x + 1, y, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x + 1, y, z + 1)) && (x + 2 >= dimensions[0] || chunk.contains(x + 2, y, z))) UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x + 1, y, z);
                }
            }

            // Update (y+1, y-1) blocks.
            if (y > 0) {
                if (chunk.contains(x, y - 1, z)) {
                    ym = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y - 1, z)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y - 1, z)) && (z - 1 < 0 || chunk.contains(x, y - 1, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x, y - 1, z + 1)) && (y - 2 < 0 || chunk.contains(x, y - 2, z))) UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y - 1, z);
                }
            }
            if (y < dimensions[1]) {
                if (chunk.contains(x, y + 1, z)) {
                    yp = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y + 1, z)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y + 1, z)) && (z - 1 < 0 || chunk.contains(x, y + 1, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x, y, z + 1)) && (y + 2 >= dimensions[1] || chunk.contains(x, y + 2, z))) UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y + 1, z);
                }
            }

            // Update (z-1, z+1) blocks.
            if (z > 0) {
                if (chunk.contains(x, y, z - 1)) {
                    zm = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y, z - 1)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y, z - 1)) && (y - 1 < 0 || chunk.contains(x, y - 1, z - 1)) && (y + 1 >= dimensions[1] || chunk.contains(x, y + 1, z - 1)) && (z - 2 < 0 || chunk.contains(x, y, z - 2))) UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z - 1);
                }
            }
            if (z < dimensions[2]) {
                if (chunk.contains(x, y, z + 1)) {
                    zp = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y, z + 1)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y, z + 1)) && (y - 1 < 0 || chunk.contains(x, y - 1, z + 1)) && (y + 1 >= dimensions[1] || chunk.contains(x, y + 1, z + 1)) && (z + 2 >= dimensions[2] || chunk.contains(x, y, z + 2))) UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z + 1);
                }
            }

            // Update current block.
            if (!(xm && ym && xp && yp && zm && zp)) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z);
        }

        // BLOCK DELETION

    }, {
        key: 'updateSurfaceBlocksAfterDeletion',
        value: function updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z) {
            var surfaceBlocks = chunk.surfaceBlocks;
            var dimensions = chunk.dimensions;
            var xp = false;var xm = false;
            var yp = false;var ym = false;
            var zp = false;var zm = false;

            // Update (x+1, x-1) blocks.
            if (x > 0) {
                if (chunk.contains(x - 1, y, z)) {
                    xm = true;
                    if ((y - 1 < 0 || chunk.contains(x - 1, y - 1, z)) && (y + 1 >= dimensions[1] || chunk.contains(x - 1, y + 1, z)) && (z - 1 < 0 || chunk.contains(x - 1, y, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x - 1, y, z + 1)) && (x - 2 < 0 || chunk.contains(x - 2, y, z))) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x - 1, y, z);
                }
            }
            if (x < dimensions[0]) {
                if (chunk.contains(x + 1, y, z)) {
                    xp = true;
                    if ((y - 1 < 0 || chunk.contains(x + 1, y - 1, z)) && (y + 1 >= dimensions[1] || chunk.contains(x + 1, y + 1, z)) && (z - 1 < 0 || chunk.contains(x + 1, y, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x + 1, y, z + 1)) && (x + 2 >= dimensions[0] || chunk.contains(x + 2, y, z))) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x + 1, y, z);
                }
            }

            // Update (y+1, y-1) blocks.
            if (y > 0) {
                if (chunk.contains(x, y - 1, z)) {
                    ym = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y - 1, z)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y - 1, z)) && (z - 1 < 0 || chunk.contains(x, y - 1, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x, y - 1, z + 1)) && (y - 2 < 0 || chunk.contains(x, y - 2, z))) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y - 1, z);
                }
            }
            if (y < dimensions[1]) {
                if (chunk.contains(x, y + 1, z)) {
                    yp = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y + 1, z)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y + 1, z)) && (z - 1 < 0 || chunk.contains(x, y + 1, z - 1)) && (z + 1 >= dimensions[2] || chunk.contains(x, y + 1, z + 1)) && (y + 2 >= dimensions[1] || chunk.contains(x, y + 2, z))) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y + 1, z);
                }
            }

            // Update (z-1, z+1) blocks.
            if (z > 0) {
                if (chunk.contains(x, y, z - 1)) {
                    zm = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y, z - 1)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y, z - 1)) && (y - 1 < 0 || chunk.contains(x, y - 1, z - 1)) && (y + 1 >= dimensions[1] || chunk.contains(x, y + 1, z - 1)) && (z - 2 < 0 || chunk.contains(x, y, z - 2))) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z - 1);
                }
            }
            if (z < dimensions[2]) {
                if (chunk.contains(x, y, z + 1)) {
                    zp = true;
                    if ((x - 1 < 0 || chunk.contains(x - 1, y, z + 1)) && (x + 1 >= dimensions[0] || chunk.contains(x + 1, y, z + 1)) && (y - 1 < 0 || chunk.contains(x, y - 1, z + 1)) && (y + 1 >= dimensions[1] || chunk.contains(x, y + 1, z + 1)) && (z + 2 >= dimensions[2] || chunk.contains(x, y, z + 2))) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z + 1);
                }
            }

            // Update current block.
            if (!(xm && ym && xp && yp && zm && zp)) // Was the current block a surface block?
                UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z);
        }
    }]);
    return UpdaterBlock;
}();

exports.default = UpdaterBlock;
//# sourceMappingURL=updater_block.js.map
