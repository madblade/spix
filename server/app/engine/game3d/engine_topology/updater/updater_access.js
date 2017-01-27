/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _geometry = require('../../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _numbers = require('../../../math/numbers');

var _numbers2 = _interopRequireDefault(_numbers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UpdaterAccess = function () {
    function UpdaterAccess() {
        (0, _classCallCheck3.default)(this, UpdaterAccess);
    }

    (0, _createClass3.default)(UpdaterAccess, null, [{
        key: 'addBlock',
        value: function addBlock(originEntity, x, y, z, blockId, world, entityModel) {
            var dimX = world.xSize,
                dimY = world.ySize,
                dimZ = world.zSize;
            var chunkCoordinates = world.getChunkCoordinates(x, y, z);
            var chunk = world.getChunk.apply(world, (0, _toConsumableArray3.default)(chunkCoordinates));

            var xOnChunk = (x >= 0 ? x : dimX - -x % dimX) % dimX;
            var yOnChunk = (y >= 0 ? y : dimY - -y % dimY) % dimY;
            var zOnChunk = (z >= 0 ? z : dimZ - -z % dimZ) % dimZ;

            var coordsOnChunk = [xOnChunk, yOnChunk, zOnChunk];

            function failure(reason) {
                console.log('Request denied: ' + reason);
            }

            if (!UpdaterAccess.validateBlockEdition(originEntity, x, y, z)) {
                failure('Requested location is too far away.');
                return;
            }

            if (chunk.what.apply(chunk, coordsOnChunk) !== 0) {
                failure('Cannot add a block on a non-empty block.');
                return;
            }

            if (entityModel.anEntityIsPresentOn(x, y, z)) {
                failure('An entity is present on the block.');
                return false;
            }

            return [chunk].concat(coordsOnChunk, [blockId]);
        }
    }, {
        key: 'delBlock',
        value: function delBlock(originEntity, x, y, z, world, entityModel) {
            // Translate.
            var dimX = world.xSize,
                dimY = world.ySize,
                dimZ = world.zSize;
            var chunkCoordinates = world.getChunkCoordinates(x, y, z);
            var chunk = world.getChunk.apply(world, (0, _toConsumableArray3.default)(chunkCoordinates));

            var xOnChunk = (x >= 0 ? x : dimX - -x % dimX) % dimX;
            var yOnChunk = (y >= 0 ? y : dimY - -y % dimY) % dimY;
            var zOnChunk = (z >= 0 ? z : dimZ - -z % dimZ) % dimZ;

            var coordsOnChunk = [xOnChunk, yOnChunk, zOnChunk];

            // Validate.
            function failure(reason) {
                console.log('Request denied: ' + reason);
            }

            if (!UpdaterAccess.validateBlockEdition(originEntity, x, y, z)) {
                failure('requested location is too far away.');
                return;
            }

            if (chunk.what.apply(chunk, coordsOnChunk) === 0) {
                failure('Cannot delete an empty block.');
                return;
            }

            return [chunk].concat(coordsOnChunk);
        }
    }, {
        key: 'validateBlockEdition',
        value: function validateBlockEdition(originEntity, x, y, z) {
            // 10 blocks maximum range for block editing.
            var d3 = _geometry2.default.euclideanDistance3(originEntity.position, [x + .5, y + .5, z + .5]);
            return d3 < 10;
        }
    }]);
    return UpdaterAccess;
}();

exports.default = UpdaterAccess;
//# sourceMappingURL=updater_access.js.map
