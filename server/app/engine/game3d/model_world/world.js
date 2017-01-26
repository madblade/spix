/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var World = function () {
    function World(id, worldModel) {
        (0, _classCallCheck3.default)(this, World);


        this._worldId = id; // Identifier
        this._worldModel = worldModel;

        // Chunk id (i+','+j+','+k) -> chunk
        this._chunks = new _map2.default();

        // Keep same generation method
        this._generationMethod = "flat";

        // Constants
        this._xSize = 16;
        this._ySize = 16;
        this._zSize = 32;
    }

    (0, _createClass3.default)(World, [{
        key: 'addChunk',
        value: function addChunk(id, chunk) {
            this._chunks.set(id, chunk);
        }
    }, {
        key: 'getChunkCoordinates',
        value: function getChunkCoordinates(x, y, z) {
            var f = Math.floor;
            var dx = this.xSize,
                dy = this.ySize,
                dz = this.zSize;
            return [f(x / dx), f(y / dy), f(z / dz)];
        }
    }, {
        key: 'getChunkByCoordinates',
        value: function getChunkByCoordinates(x, y, z) {
            var c = this.getChunkCoordinates(x, y, z);
            return this.getChunk.apply(this, (0, _toConsumableArray3.default)(c));
        }
    }, {
        key: 'whatBlock',
        value: function whatBlock(x, y, z) {
            var coords = this.getChunkCoordinates(x, y, z);

            var dx = this.xSize,
                dy = this.ySize,
                dz = this.zSize;
            var i = coords[0],
                j = coords[1],
                k = coords[2];

            var chunkX = x - i * dx;
            var chunkY = y - j * dy;
            var chunkZ = z - k * dz;

            var chunkId = i + ',' + j + ',' + k;
            var chunk = this._chunks.get(chunkId);
            if (!chunk || chunk === undefined) {
                console.log('ChkMgr@whatBlock: could not find chunk ' + chunkId + ' from ' + x + ',' + y + ',' + z);
                // TODO [MEDIUM] load concerned chunk.
                // TODO [MEDIUM] check minus
                return;
            }

            return chunk.what(chunkX, chunkY, chunkZ);
        }
    }, {
        key: 'getFreePosition',
        value: function getFreePosition() {
            var zLimit = this._zSize;
            var z = zLimit - 2;
            while (this.whatBlock(4, 4, z) !== 0 && z < zLimit) {
                ++z;
            }return [4.5, 4.5, z];
        }
    }, {
        key: 'getChunk',
        value: function getChunk(iCoordinate, jCoordinate, kCoordinate) {
            var id = iCoordinate + ',' + jCoordinate + ',' + kCoordinate;
            return this._chunks.get(id);
        }
    }, {
        key: 'getChunkById',
        value: function getChunkById(chunkId) {
            return this._chunks.get(chunkId);
        }
    }, {
        key: 'hasChunkById',
        value: function hasChunkById(chunkId) {
            return this._chunks.has(chunkId);
        }
    }, {
        key: 'hasChunk',
        value: function hasChunk(i, j, k) {
            return !!this.getChunk(i, j, k);
        }
    }, {
        key: 'isFree',
        value: function isFree(p) {
            return this.whatBlock(p[0], p[1], p[2]) === 0; // && this.whatBlock(p[0], p[1], p[2]+1) === 0;
        }
    }, {
        key: 'worldId',
        get: function get() {
            return this._worldId;
        }
    }, {
        key: 'xSize',
        get: function get() {
            return this._xSize;
        }
    }, {
        key: 'ySize',
        get: function get() {
            return this._ySize;
        }
    }, {
        key: 'zSize',
        get: function get() {
            return this._zSize;
        }
    }, {
        key: 'allChunks',
        get: function get() {
            return this._chunks;
        },
        set: function set(newChunks) {
            this._chunks = newChunks;
        }
    }, {
        key: 'generationMethod',
        get: function get() {
            return this._generationMethod;
        },
        set: function set(newGenerationMethod) {
            this._generationMethod = newGenerationMethod;
        }
    }]);
    return World;
}();

exports.default = World;
//# sourceMappingURL=world.js.map
