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

var _surface_blocks_builder = require('./../engine_consistency/builder/surface_blocks_builder');

var _surface_blocks_builder2 = _interopRequireDefault(_surface_blocks_builder);

var _surface_faces_builder = require('./../engine_consistency/builder/surface_faces_builder');

var _surface_faces_builder2 = _interopRequireDefault(_surface_faces_builder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Chunk = function () {
    function Chunk(xSize, ySize, zSize, chunkId, world) {
        (0, _classCallCheck3.default)(this, Chunk);

        // App.
        this._world = world;

        // Dimensions, coordinates
        this._xSize = xSize;
        this._ySize = ySize;
        this._zSize = zSize;

        this._capacity = this._xSize * this._ySize * this._zSize;
        this._chunkId = chunkId;
        var ijk = chunkId.split(',');

        this._chunkI = parseInt(ijk[0]);
        this._chunkJ = parseInt(ijk[1]);
        this._chunkK = parseInt(ijk[2]);

        // Blocks.
        /** Flatten array. x, then y, then z. */
        this._blocks = new Uint8Array();
        /** Nested z-array. (each z -> i×j layer, without primary offset) */
        this._surfaceBlocks = {}; // TODO [HIGH] refactor to map.
        /** Each face -> index of its connected component. */
        this._connectedComponents = new Uint8Array();
        /**  Each connected component -> (sorted) list of face indices. */
        this._fastConnectedComponents = {};
        this._fastConnectedComponentsIds = {}; // Signed.
        this._ready = false;

        // Events.
        this._lastUpdated = process.hrtime();
        this._updates = [{}, {}, {}];
    }

    // Getters


    (0, _createClass3.default)(Chunk, [{
        key: '_toId',
        value: function _toId(x, y, z) {
            var id = x + y * this._xSize + z * this._xSize * this._ySize;
            if (id >= this._capacity) console.log("chunk._toId: invalid request coordinates.");
            return id;
        }
    }, {
        key: 'what',
        value: function what(x, y, z) {
            var id = this._toId(x, y, z);
            if (id >= this._capacity || id < 0) return 0;
            return this._blocks[id];
        }
    }, {
        key: 'contains',
        value: function contains(x, y, z) {
            return this.what(x, y, z) !== 0;
        }
    }, {
        key: 'getNeighbourChunkFromRelativeCoordinates',
        value: function getNeighbourChunkFromRelativeCoordinates(x, y, z) {
            var neighbourChunkI = void 0,
                neighbourChunkJ = void 0,
                neighbourChunkK = void 0;
            var xS = this._xSize,
                yS = this._ySize,
                zS = this._zSize;
            var ci = this._chunkI,
                cj = this._chunkJ,
                ck = this._chunkK;
            var world = this._world;

            if (x < 0) neighbourChunkI = ci - 1;else if (x >= xS) neighbourChunkI = ci + 1;else neighbourChunkI = ci;

            if (y < 0) neighbourChunkJ = cj - 1;else if (y >= yS) neighbourChunkJ = cj + 1;else neighbourChunkJ = cj;

            if (z < 0) neighbourChunkK = ck - 1;else if (z >= zS) neighbourChunkK = ck + 1;else neighbourChunkK = ck;

            return world.getChunk(neighbourChunkI, neighbourChunkJ, neighbourChunkK);
        }

        // Mustn't exceed negative [xyz] Size

    }, {
        key: 'neighbourWhat',
        value: function neighbourWhat(x, y, z) {
            var localX = void 0,
                localY = void 0,
                localZ = void 0;
            var xS = this._xSize,
                yS = this._ySize,
                zS = this._zSize;

            if (x < 0) localX = xS + x;else if (x >= xS) localX = x % xS;else localX = x;

            if (y < 0) localY = yS + y;else if (y >= yS) localY = y % yS;else localY = y;

            if (z < 0) localZ = zS + z;else if (z >= zS) localZ = z % zS;else localZ = z;

            var nChunk = this.getNeighbourChunkFromRelativeCoordinates(x, y, z);
            return nChunk.what(localX, localY, localZ);
        }
    }, {
        key: 'neighbourContains',
        value: function neighbourContains(x, y, z) {
            return this.neighbourWhat(x, y, z) !== 0;
        }
    }, {
        key: 'add',
        value: function add(x, y, z, blockId) {
            var id = this._toId(x, y, z);
            if (id >= this._capacity) return;

            // Update blocks, surface blocks, then surface faces.
            this._blocks[id] = blockId;
            return id;
        }
    }, {
        key: 'del',
        value: function del(x, y, z) {
            var id = this._toId(x, y, z);
            if (id >= this._capacity) return;

            // Update blocks, surface blocks, then surface faces.
            this._blocks[id] = 0;
            return id;
        }
    }, {
        key: 'flushUpdates',
        value: function flushUpdates() {
            this._updates = [{}, {}, {}];
        }
    }, {
        key: 'chunkI',
        get: function get() {
            return this._chunkI;
        }
    }, {
        key: 'chunkJ',
        get: function get() {
            return this._chunkJ;
        }
    }, {
        key: 'chunkK',
        get: function get() {
            return this._chunkK;
        }
    }, {
        key: 'chunkId',
        get: function get() {
            return this._chunkId;
        }
    }, {
        key: 'dimensions',
        get: function get() {
            return [this._xSize, this._ySize, this._zSize];
        }
    }, {
        key: 'capacity',
        get: function get() {
            return this._capacity;
        }
    }, {
        key: 'blocks',
        get: function get() {
            return this._blocks;
        },


        // Setters
        set: function set(newBlocks) {
            this._blocks = newBlocks;
        }
    }, {
        key: 'surfaceBlocks',
        get: function get() {
            return this._surfaceBlocks;
        },
        set: function set(newSurfaceBlocks) {
            this._surfaceBlocks = newSurfaceBlocks;
        }
    }, {
        key: 'fastComponents',
        get: function get() {
            return this._fastConnectedComponents;
        },
        set: function set(newFastComponents) {
            this._fastConnectedComponents = newFastComponents;
        }
    }, {
        key: 'fastComponentsIds',
        get: function get() {
            return this._fastConnectedComponentsIds;
        },
        set: function set(newFastComponentsIds) {
            this._fastConnectedComponentsIds = newFastComponentsIds;
        }
    }, {
        key: 'connectedComponents',
        get: function get() {
            return this._connectedComponents;
        },
        set: function set(newConnectedComponents) {
            this._connectedComponents = newConnectedComponents;
        }
    }, {
        key: 'updates',
        get: function get() {
            return this._updates;
        },
        set: function set(newUpdates) {
            this._updates = newUpdates;
        }
    }, {
        key: 'ready',
        get: function get() {
            return this._ready;
        },
        set: function set(newReady) {
            this._ready = newReady;
        }
    }, {
        key: 'world',
        get: function get() {
            return this._world;
        }
    }]);
    return Chunk;
}();

Chunk.debug = false;
exports.default = Chunk;
//# sourceMappingURL=chunk.js.map
