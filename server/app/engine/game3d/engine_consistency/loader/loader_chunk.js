/**
 * Extract chunk surfaces and build hierarchy.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _geometry = require('../../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../../model_world/model');

var _model2 = _interopRequireDefault(_model);

var _worldgenerator = require('../generator/worldgenerator');

var _worldgenerator2 = _interopRequireDefault(_worldgenerator);

var _iterator_chunks = require('../builder/iterator_chunks');

var _iterator_chunks2 = _interopRequireDefault(_iterator_chunks);

var _builder_chunks = require('../builder/builder_chunks');

var _builder_chunks2 = _interopRequireDefault(_builder_chunks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ChunkLoader = function () {
    function ChunkLoader(consistencyEngine) {
        (0, _classCallCheck3.default)(this, ChunkLoader);

        // Models.
        this._worldModel = consistencyEngine.worldModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
        this._xModel = consistencyEngine.xModel;
    }

    (0, _createClass3.default)(ChunkLoader, [{
        key: 'computeChunksForNewPlayer',
        value: function computeChunksForNewPlayer(player) {
            var avatar = player.avatar;
            var worldId = avatar.worldId;
            var world = this._worldModel.getWorld(worldId);

            // Object to be (JSON.stringify)-ed.
            var chunksForNewPlayer = {};
            var chunksInModel = world.allChunks;

            // From player position, find concerned chunks.
            var playerPosition = avatar.position;
            var coords = world.getChunkCoordinates(playerPosition[0], playerPosition[1], playerPosition[2]);

            var i = coords[0],
                j = coords[1],
                k = coords[2];
            var dx = world.xSize,
                dy = world.ySize,
                dz = world.zSize;
            var minChunkDistance = Number.POSITIVE_INFINITY;

            var chunkIds = [];
            chunkIds.push(i + ',' + j + ',' + k);

            for (var m = 0, length = chunkIds.length; m < length; ++m) {
                var currentChunkId = chunkIds[m];

                // Generate chunk.
                if (!chunksInModel.has(currentChunkId)) {
                    // TODO [LOW] worldify or delegate to consistency updater (better).
                    if (ChunkLoader.debug) console.log("We should generate " + currentChunkId + " for the user.");
                    var chunk = _worldgenerator2.default.generateFlatChunk(dx, dy, dz, currentChunkId, world);
                    chunksInModel.set(currentChunkId, chunk);
                }

                // Extract surfaces.
                var currentChunk = chunksInModel.get(currentChunkId);
                if (!currentChunk.ready) {
                    if (ChunkLoader.debug) console.log("We should extract faces from " + currentChunkId + ".");
                    _builder_chunks2.default.computeChunkFaces(currentChunk);
                }

                // Test for distance.
                var ids = currentChunkId.split(',');
                var chunkPosition = [parseInt(ids[0]) * dx / 2, parseInt(ids[1]) * dy / 2, parseInt(ids[2]) * dz / 2];
                var distance = _geometry2.default.chunkSquaredEuclideanDistance(chunkPosition, playerPosition);
                if (distance < minChunkDistance) {
                    minChunkDistance = distance;
                    avatar.nearestChunkId = currentChunk;
                }

                var cfnpw = chunksForNewPlayer[worldId];
                if (cfnpw) {
                    cfnpw[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
                } else {
                    chunksForNewPlayer[worldId] = {};
                    chunksForNewPlayer[worldId][currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
                }
            }

            return chunksForNewPlayer;
        }

        // THOUGHT [OPTIM] n nearest, 1 chunk per X.
        // no more than X chunk per player per iteration?

    }, {
        key: 'computeNewChunksInRange',
        value: function computeNewChunksInRange(player) {
            if (!ChunkLoader.load) return;
            var avatar = player.avatar;

            var worldId = avatar.worldId;
            var world = this._worldModel.getWorld(worldId);
            var consistencyModel = this._consistencyModel;

            var pos = avatar.position;

            // Has nearest chunk changed?
            var coords = world.getChunkCoordinates(pos[0], pos[1], pos[2]);
            var nearestChunkId = coords[0] + ',' + coords[1] + ',' + coords[2];
            var formerNearestChunkId = avatar.nearestChunkId;

            // Get current chunk.
            var starterChunk = world.getChunkById(nearestChunkId);
            if (!starterChunk) {
                console.log('Could not load chunk on which current entity is.');
                return;
            }

            // Return variables.
            var newChunksForPlayer = {};
            var unloadedChunksForPlayer = {};

            // Case 1: need to load chunks up to R_i (inner circle)
            // and to unload from R_o (outer circle).
            if (!consistencyModel.doneChunkLoadingPhase(player, starterChunk)) {
                newChunksForPlayer = this.loadInnerSphere(player, starterChunk);
                // For (i,j,k) s.t. D = d({i,j,k}, P) < P.thresh, ordered by increasing D
                // if !P.has(i,j,k)
                // Load (i,j,k) and break

                // unloadedChunksForPlayer = this.unloadInnerToOuterSphere(player, starterChunk);
                unloadedChunksForPlayer = this.unloadOuterSphere(player, starterChunk);
                // For (i,j,k) s.t. P.has(i,j,k)
                // if d({i,j,k}, P) > P.thresh
                // Unload (i,j,k)
                avatar.nearestChunkId = nearestChunkId;
            }

            // THOUGHT [OPTIM] don't test when doneChunkLoadingPhase has been reached once, until (nearest !== formerNearest)
            // Case 2: if chunks were loaded up to R_i, but player walked
            // into another chunk. Need to ensure all chunks are loaded up to R_i
            // and every loaded chunk that happens to be outside R_o is unloaded.
            /*
            else if (nearestChunkId !== formerNearestChunkId) {
                 // For (i,j,k) s.t. d({i,j,k}, P) < P.thresh
                    // if !P.has(i,j,k)
                        // Load (i,j,k) and break
                newChunksForPlayer = this.loadInnerSphere(player, starterChunk);
                 // For (i,j,k) s.t. P.has(i,j,k)
                    // if d({i,j,k}, P) > P.outerThresh
                        // Unload (i,j,k)
                unloadedChunksForPlayer = this.unloadOuterSphere(player, starterChunk);
                avatar.nearestChunkId = nearestChunkId;
            }
            */

            // No avatar position change, nothing to update.
            else {
                    unloadedChunksForPlayer = this.unloadOuterSphere(player, starterChunk);
                    return;
                }

            // Nothing to update.
            if ((0, _keys2.default)(newChunksForPlayer).length < 1 && (0, _keys2.default)(unloadedChunksForPlayer).length < 1) return;

            return [newChunksForPlayer, unloadedChunksForPlayer];
        }
    }, {
        key: 'loadInnerSphere',
        value: function loadInnerSphere(player, starterChunk) {
            var worldId = player.avatar.worldId;
            var worldModel = this._worldModel;
            var xModel = this._xModel;
            var consistencyModel = this._consistencyModel;
            // TODO [HIGH] worldify think of another location for that
            var world = worldModel.getWorld(worldId);
            var sRadius = _model2.default.serverLoadingRadius;

            var newChunksForPlayer = {};

            // Loading circle for server (a bit farther)
            var t = process.hrtime();

            var wid = starterChunk.world.worldId;
            var cid = starterChunk.chunkId;
            _builder_chunks2.default.loadNextChunk(player, wid, cid, worldModel, xModel, consistencyModel, sRadius, false);

            var dt1 = process.hrtime(t)[1] / 1000;
            if (ChunkLoader.bench && dt1 > 1000) console.log('\t\t' + dt1 + ' preLoad ForServer.');

            // Loading circle for client (nearer)
            // Only load one at a time!
            // TODO [HIGH] check on Z+/-.
            // TODO [LONG-TERM] enhance to transmit chunks when users are not so much active and so on.
            t = process.hrtime();

            var newChunk = _builder_chunks2.default.loadNextChunk(player, wid, cid, worldModel, xModel, consistencyModel, sRadius, true);

            dt1 = process.hrtime(t)[1] / 1000;
            if (ChunkLoader.bench && dt1 > 1000) console.log('\t\t' + dt1 + ' preLoad ForPlayer.');

            if (newChunk) {
                if (ChunkLoader.debug) console.log("New chunk : " + newChunk.chunkId);
                // TODO [HIGH] not only one at a time
                newChunksForPlayer[newChunk.world.worldId] = (0, _defineProperty3.default)({}, newChunk.chunkId, [newChunk.fastComponents, newChunk.fastComponentsIds]);
            }

            return newChunksForPlayer;
        }
    }, {
        key: 'unloadInnerToOuterSphere',
        value: function unloadInnerToOuterSphere(player, starterChunk) {
            var consistencyModel = this._consistencyModel;
            var worldModel = this._worldModel;
            var xModel = this._xModel;

            var minThreshold = player.avatar.chunkRenderDistance;
            var maxThreshold = _model2.default.serverLoadingRadius;
            minThreshold = Math.min(minThreshold, maxThreshold);

            return _builder_chunks2.default.getOOBPlayerChunks(player, starterChunk, worldModel, xModel, consistencyModel, minThreshold);
        }
    }, {
        key: 'unloadOuterSphere',
        value: function unloadOuterSphere(player, starterChunk) {
            var consistencyModel = this._consistencyModel;
            var worldModel = this._worldModel;
            var xModel = this._xModel;

            var maxThreshold = player.avatar.chunkUnloadDistance;

            return _builder_chunks2.default.getOOBPlayerChunks(player, starterChunk, worldModel, xModel, consistencyModel, maxThreshold);
        }
    }]);
    return ChunkLoader;
}();

ChunkLoader.debug = false;
ChunkLoader.load = true;
ChunkLoader.bench = false;
exports.default = ChunkLoader;
//# sourceMappingURL=loader_chunk.js.map
