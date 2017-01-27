/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _geometry = require('../../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _chunkgenerator = require('./../generator/chunkgenerator');

var _chunkgenerator2 = _interopRequireDefault(_chunkgenerator);

var _surface_blocks_builder = require('./surface_blocks_builder');

var _surface_blocks_builder2 = _interopRequireDefault(_surface_blocks_builder);

var _surface_faces_builder = require('./surface_faces_builder');

var _surface_faces_builder2 = _interopRequireDefault(_surface_faces_builder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ChunkBuilder = function () {
    function ChunkBuilder() {
        (0, _classCallCheck3.default)(this, ChunkBuilder);
    }

    (0, _createClass3.default)(ChunkBuilder, null, [{
        key: 'computeChunkFaces',
        value: function computeChunkFaces(chunk) {
            var world = chunk.world;

            // Preload neighbours.
            if (ChunkBuilder.debug) console.log('\tPreloading neighbor chunks...');
            ChunkBuilder.preloadAllNeighbourChunks(chunk, world);

            // Detect boundary blocks.
            if (ChunkBuilder.debug) console.log('\tExtracting surface...');
            _surface_blocks_builder2.default.extractSurfaceBlocks(chunk);

            // Detect connected boundary face components.
            if (ChunkBuilder.debug) console.log("\tComputing connected components...");
            _surface_faces_builder2.default.extractConnectedComponents(chunk);

            chunk.ready = true;
        }

        /** MODEL
         0	i+1,	j,		k
         1	i-1,	j,		k
         2	i,		j+1,	k
         3	i,		j-1,	k
         4	i,		j,		k+1
         5	i,		j,		k-1
         6	i+1,	j+1,	k
         7	i-1,	j+1,	k
         8	i+1,	j-1,	k
         9	i-1,	j-1,	k
         10	i+1,	j,		k-1
         11	i+1,	j,		k+1
         12	i-1,	j,		k-1
         13	i-1,	j,		k+1
         14	i,		j+1,	k+1
         15	i,		j-1,	k+1
         16	i,		j+1,	k-1
         17	i,		j-1,	k-1
        */

    }, {
        key: 'getNeighboringChunk',
        value: function getNeighboringChunk(chunk, direction) {
            var i = chunk.chunkI;
            var j = chunk.chunkJ;
            var k = chunk.chunkK;
            var world = chunk.world;

            switch (direction) {
                case 0:
                    return world.getChunk(i + 1, j, k); // x+
                case 1:
                    return world.getChunk(i - 1, j, k); // x-
                case 2:
                    return world.getChunk(i, j + 1, k); // y+
                case 3:
                    return world.getChunk(i, j - 1, k); // y-
                case 4:
                    return world.getChunk(i, j, k + 1); // z+
                case 5:
                    return world.getChunk(i, j, k - 1); // z- (idem)
                case 6:
                    return world.getChunk(i + 1, j + 1, k);
                case 7:
                    return world.getChunk(i - 1, j + 1, k);
                case 8:
                    return world.getChunk(i + 1, j - 1, k);
                case 9:
                    return world.getChunk(i - 1, j - 1, k);
                case 10:
                    return world.getChunk(i + 1, j, k - 1);
                case 11:
                    return world.getChunk(i + 1, j, k + 1);
                case 12:
                    return world.getChunk(i - 1, j, k - 1);
                case 13:
                    return world.getChunk(i - 1, j, k + 1);
                case 14:
                    return world.getChunk(i, j + 1, k + 1);
                case 15:
                    return world.getChunk(i, j - 1, k + 1);
                case 16:
                    return world.getChunk(i, j + 1, k - 1);
                case 17:
                    return world.getChunk(i, j - 1, k - 1);

                default:
            }
        }
    }, {
        key: 'isNeighboringChunkLoaded',
        value: function isNeighboringChunkLoaded(chunk, direction) {
            var i = chunk.chunkI;
            var j = chunk.chunkJ;
            var k = chunk.chunkK;
            var world = chunk.world;

            switch (direction) {
                case 0:
                    return world.hasChunk(i + 1, j, k); // x+
                case 1:
                    return world.hasChunk(i - 1, j, k); // x-
                case 2:
                    return world.hasChunk(i, j + 1, k); // y+
                case 3:
                    return world.hasChunk(i, j - 1, k); // y-
                case 4:
                    return world.hasChunk(i, j, k + 1); // z+ (non-flat models)
                case 5:
                    return world.hasChunk(i, j, k - 1); // z-
                case 6:
                    return world.hasChunk(i + 1, j + 1, k);
                case 7:
                    return world.hasChunk(i - 1, j + 1, k);
                case 8:
                    return world.hasChunk(i + 1, j - 1, k);
                case 9:
                    return world.hasChunk(i - 1, j - 1, k);
                case 10:
                    return world.hasChunk(i + 1, j, k - 1);
                case 11:
                    return world.hasChunk(i + 1, j, k + 1);
                case 12:
                    return world.hasChunk(i - 1, j, k - 1);
                case 13:
                    return world.hasChunk(i - 1, j, k + 1);
                case 14:
                    return world.hasChunk(i, j + 1, k + 1);
                case 15:
                    return world.hasChunk(i, j - 1, k + 1);
                case 16:
                    return world.hasChunk(i, j + 1, k - 1);
                case 17:
                    return world.hasChunk(i, j - 1, k - 1);
                default:
            }
        }
    }, {
        key: 'preloadAllNeighbourChunks',
        value: function preloadAllNeighbourChunks(chunk, world) {
            var loadedChunks = world.allChunks;
            var c = chunk;
            var dims = c.dimensions;
            var ci = c.chunkI,
                cj = c.chunkJ,
                ck = c.chunkK;

            var neighbourIds = [ci + 1 + ',' + cj + ',' + ck, //  i+1,	j,		k
            ci + ',' + (cj + 1) + ',' + ck, //  i-1,	j,		k
            ci + ',' + cj + ',' + (ck + 1), //  i,		j+1,	k
            ci - 1 + ',' + cj + ',' + ck, //  i,		j-1,	k
            ci + ',' + (cj - 1) + ',' + ck, //  i,		j,		k+1
            ci + ',' + cj + ',' + (ck - 1), //  i,		j,		k-1
            ci + 1 + ',' + (cj + 1) + ',' + ck, //  i+1,	j+1,	k
            ci - 1 + ',' + (cj + 1) + ',' + ck, //  i-1,	j+1,	k
            ci + 1 + ',' + (cj - 1) + ',' + ck, //  i+1,	j-1,	k
            ci - 1 + ',' + (cj - 1) + ',' + ck, //  i-1,	j-1,	k
            ci + 1 + ',' + cj + ',' + (ck - 1), //  i+1,	j,		k-1
            ci + 1 + ',' + cj + ',' + (ck + 1), //  i+1,	j,		k+1
            ci - 1 + ',' + cj + ',' + (ck - 1), //  i-1,	j,		k-1
            ci - 1 + ',' + cj + ',' + (ck + 1), //  i-1,	j,		k+1
            ci + ',' + (cj + 1) + ',' + (ck + 1), //  i,		j+1,	k+1
            ci + ',' + (cj - 1) + ',' + (ck + 1), //  i,		j-1,	k+1
            ci + ',' + (cj + 1) + ',' + (ck - 1), //  i,		j+1,	k-1
            ci + ',' + (cj - 1) + ',' + (ck - 1) //  i,		j-1,	k-1
            ];

            for (var i = 0, length = neighbourIds.length; i < length; ++i) {
                var currentId = neighbourIds[i];
                if (loadedChunks.has(currentId)) continue;

                // Don't compute faces
                var neighbour = _chunkgenerator2.default.createChunk(dims[0], dims[1], dims[2], currentId, world);
                world.addChunk(currentId, neighbour);
            }
        }
    }, {
        key: 'preloadFlatNeighbourChunks',
        value: function preloadFlatNeighbourChunks(chunk, world) {
            var loadedChunks = world.allChunks;
            var c = chunk;
            var ci = c.chunkI;
            var cj = c.chunkJ;
            var ck = c.chunkK;
            var dims = c.dimensions;

            var neighbourIds = [ci + 1 + ',' + cj + ',' + ck, ci + ',' + (cj + 1) + ',' + ck, ci + ',' + cj + ',' + (ck + 1), ci - 1 + ',' + cj + ',' + ck, ci + ',' + (cj - 1) + ',' + ck, ci + ',' + cj + ',' + (ck - 1)];

            for (var i = 0, length = neighbourIds.length; i < length; ++i) {
                var currentId = neighbourIds[i];
                if (loadedChunks.has(currentId)) continue;

                // Don't compute faces
                var neighbour = _chunkgenerator2.default.createChunk(dims[0], dims[1], dims[2], currentId, world);
                world.addChunk(currentId, neighbour);
            }
        }
    }, {
        key: 'addChunk',
        value: function addChunk(dimX, dimY, dimZ, chunkId, world) {
            // Do compute faces
            var chunk = _chunkgenerator2.default.createChunk(dimX, dimY, dimZ, chunkId, world);
            world.addChunk(chunkId, chunk);
            ChunkBuilder.computeChunkFaces(chunk);
            return chunk;
        }
    }, {
        key: 'loadNextChunk',
        value: function loadNextChunk(player, startWid, startCid, worldModel, xModel, consistencyModel, serverLoadingRadius, forPlayer) {

            var avatar = player.avatar;
            var threshold = forPlayer ? avatar.chunkRenderDistance : serverLoadingRadius;
            threshold = Math.min(threshold, serverLoadingRadius);

            var connectivity = xModel.getConnectivity(startWid, startCid, worldModel, threshold, true, !forPlayer);
            if (!connectivity) return;
            var chunks = connectivity[1]; // !! Should be sorted from the nearest to the farthest.
            if (!chunks) return;
            var aid = avatar.id;

            var hasLoadedChunk = function hasLoadedChunk(wid, ic, jc, kc) {
                return consistencyModel.hasChunk(aid, wid, ic + ',' + jc + ',' + kc);
            };

            for (var id = 0, l = chunks.length; id < l; ++id) {
                var current = chunks[id];

                var wid = current[0];
                var currentId = current[1];
                var ijk = currentId.split(',');
                if (!hasLoadedChunk.apply(undefined, [wid].concat((0, _toConsumableArray3.default)(ijk)))) {
                    var currentWorld = worldModel.getWorld(wid);
                    var currentChunks = currentWorld.allChunks;
                    var currentChunk = currentChunks.get(currentId);
                    var dx = currentWorld.xSize,
                        dy = currentWorld.ySize,
                        dz = currentWorld.zSize;

                    if (!forPlayer) {
                        if (!currentChunk) {
                            currentChunk = ChunkBuilder.addChunk(dx, dy, dz, currentId, currentWorld);
                            currentChunks.set(currentId, currentChunk);
                            ChunkBuilder.computeChunkFaces(currentChunk);
                            return currentChunk;
                        } else if (!currentChunk.ready) {
                            ChunkBuilder.computeChunkFaces(currentChunk);
                            return currentChunk;
                        } else return null;
                    } else {
                        return currentChunk;
                    }
                }
            }
        }
    }, {
        key: 'getOOBPlayerChunks',
        value: function getOOBPlayerChunks(player, starterChunk, worldModel, xModel, consistencyModel, thresh) {
            var avatar = player.avatar;
            var unloadedChunksForPlayer = {};
            var chunksToUnload = [];

            var aid = avatar.id;
            var startWid = avatar.worldId;
            var chunkIdsForEntity = consistencyModel.chunkIdsPerWorldForEntity(aid);

            var w = worldModel.getWorld(startWid);
            if (!w) {
                console.log('Could not get starting world from avatar.');return;
            }
            var c = w.getChunkByCoordinates.apply(w, (0, _toConsumableArray3.default)(avatar.position));
            if (!c) {
                console.log('Could not get starting chunk from avatar.');return;
            }
            var startCid = c.chunkId;
            var connectivity = xModel.getConnectivity(startWid, startCid, worldModel, thresh, true);
            var okChunks = connectivity[1];
            var marks = new _map2.default();
            okChunks.forEach(function (c) {
                return marks.set(c[0] + ',' + c[1], c[2]);
            });

            chunkIdsForEntity.forEach(function (chunkIds, worldId) {
                chunkIds.forEach(function (chunkId) {
                    var distance = marks.get(worldId + ',' + chunkId);
                    if (distance === undefined || distance === null || distance > thresh) chunksToUnload.push([worldId, chunkId]);
                });
            });

            // Recurse on unloaded chunk ids.
            for (var i = 0, l = chunksToUnload.length; i < l; ++i) {
                var chunkToUnload = chunksToUnload[i];
                var currentWorld = chunkToUnload[0];
                var currentId = chunkToUnload[1];
                if (!unloadedChunksForPlayer.hasOwnProperty(currentWorld)) unloadedChunksForPlayer[currentWorld] = {};

                unloadedChunksForPlayer[currentWorld][currentId] = null;
            }

            return unloadedChunksForPlayer;
        }
    }]);
    return ChunkBuilder;
}();

ChunkBuilder.debug = false;
exports.default = ChunkBuilder;
//# sourceMappingURL=builder_chunks.js.map
