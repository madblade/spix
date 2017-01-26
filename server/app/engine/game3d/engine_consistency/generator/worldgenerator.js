/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _chunkgenerator = require('./chunkgenerator');

var _chunkgenerator2 = _interopRequireDefault(_chunkgenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WorldGenerator = function () {
    function WorldGenerator() {
        (0, _classCallCheck3.default)(this, WorldGenerator);
    }

    (0, _createClass3.default)(WorldGenerator, null, [{
        key: 'generateFlatWorld',
        value: function generateFlatWorld(chunkSizeX, chunkSizeY, chunkSizeZ, world) {
            var worldMap = new _map2.default();
            worldMap.set('0,0,0', WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0, 0, world));
            return worldMap;
            /*return {
                '0,0,0':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 0, 0, worldModel),
                '-1,0':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, -1, 0, 0, worldModel),
                '0,-1':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, -1, 0, worldModel),
                '0,1':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 0, 1, 0, worldModel),
                '1,0':      WorldGenerator.generateFlatChunk(chunkSizeX, chunkSizeY, chunkSizeZ, 1, 0, 0, worldModel)
            };*/
        }
    }, {
        key: 'generateFlatChunk',
        value: function generateFlatChunk(x, y, z, i, j, k, world) {
            var id = i + ',' + j + ',' + k;
            return _chunkgenerator2.default.createRawChunk(x, y, z, id, world);
        }
    }, {
        key: 'generatePerlinWorld',
        value: function generatePerlinWorld() {
            return new _map2.default();
        }
    }]);
    return WorldGenerator;
}();

exports.default = WorldGenerator;
//# sourceMappingURL=worldgenerator.js.map
