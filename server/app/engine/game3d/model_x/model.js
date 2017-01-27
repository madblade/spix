/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _knot = require('./knot');

var _knot2 = _interopRequireDefault(_knot);

var _portal = require('./portal');

var _portal2 = _interopRequireDefault(_portal);

var _collections = require('../../math/collections');

var _collections2 = _interopRequireDefault(_collections);

var _geometry = require('../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _worldgenerator = require('../engine_consistency/generator/worldgenerator');

var _worldgenerator2 = _interopRequireDefault(_worldgenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var XModel = function () {
    function XModel(game) {
        (0, _classCallCheck3.default)(this, XModel);

        this._game = game;
        this._worldModel = game.worldModel;

        // Database
        this._knots = new _map2.default();
        this._portals = new _map2.default();

        // world id => [map: chunk id => array of portals]
        // TODO [LONG-TERM] optimize by sorting.
        this._worldToChunksToPortals = new _map2.default();

        // Portal id => knots
        this._portalsToKnots = new _map2.default();

        // Cached requests
        this._cachedConnectivity = [new _map2.default(), new _map2.default()]; // WorldId+ChunkId -> portals ids.
        // To update whenever avatar moves from one chunk to another.
    }

    (0, _createClass3.default)(XModel, [{
        key: 'addPortal',


        /** Create / link **/

        // One knows it must link parts of this knots before it opens...
        // OtherPortalId: if null, spawns an empty portal; otherwise, links an existing portal and forge it into a knot.
        value: function addPortal(worldId, x1, y1, z1, x2, y2, z2, position, orientation, otherPortalId) {
            var world = this._worldModel.getWorld(worldId);
            var portals = this._portals;
            var worldToChunksToPortals = this._worldToChunksToPortals;

            // Check parameters.
            // Orientation should be correct.
            if (orientation !== '+' && orientation !== '-' && orientation !== 'both') return;
            // Portal must be orthogonal an axis: exactly one block coordinate in common.
            var bx = x1 === x2,
                by = y1 === y2,
                bz = z1 === z2;
            var sum = bx + by + bz;
            if (sum !== 1 && sum !== 2) {
                console.log('Portal not axis-aligned: ' + sum);
                return;
            }
            // Portal minimal size.

            // Check chunks.
            var coords1 = world.getChunkCoordinates(x1, y1, z1);
            var coords2 = world.getChunkCoordinates(x2, y2, z2);
            // Must be on one same chunk. TODO [LONG-TERM] spawn them across chunks.
            var chunk1 = world.getChunk.apply(world, (0, _toConsumableArray3.default)(coords1));
            var chunk2 = world.getChunk.apply(world, (0, _toConsumableArray3.default)(coords2));
            if (chunk1 && chunk1 !== chunk2) return;

            var portalId = _collections2.default.generateId(portals);
            var portal = new _portal2.default(worldId, portalId, [x1, y1, z1], [x2, y2, z2], position, orientation, chunk1);

            var chunkId = chunk1.chunkId;
            portals.set(portalId, portal);
            var wtpc = worldToChunksToPortals.get(worldId),
                ctpc = void 0;
            if (wtpc) {
                ctpc = wtpc.get(chunkId);
                if (ctpc) {
                    ctpc.add(portalId);
                } else {
                    ctpc = new _set2.default();
                    ctpc.add(portalId);
                    wtpc.set(chunkId, ctpc);
                }
            } else {
                wtpc = new _map2.default();
                ctpc = new _set2.default();
                ctpc.add(portalId);
                wtpc.set(chunkId, ctpc);
                worldToChunksToPortals.set(worldId, wtpc);
            }

            if (otherPortalId) {
                this.addKnot(portalId, otherPortalId);
            } else {
                var newWorld = this._worldModel.addWorld();
                if (!newWorld) {
                    console.log('Failed to create a new world.');
                    return;
                }

                // Force generation (1 chunk) and add portal.
                var xS = newWorld.xSize,
                    yS = newWorld.ySize,
                    zS = newWorld.zSize;
                // TODO [HIGH] Maybe it's not right to generate chunks here.
                var ijk = chunkId.split(',');
                var newChunk = _worldgenerator2.default.generateFlatChunk.apply(_worldgenerator2.default, [xS, yS, zS].concat((0, _toConsumableArray3.default)(ijk), [newWorld]));
                newWorld.addChunk(newChunk.chunkId, newChunk);
                this.addPortal(newWorld.worldId, x1, y1, z1, x2, y2, z2, position, orientation, portalId);
            }

            this._cachedConnectivity = [new _map2.default(), new _map2.default()];
        }

        // (x1, y1, z1): first block
        // (x2, y2, z2): second block
        // position: percentage of block towards +
        // orientation: '+', '-' or both.
        // One does not know where this one will lead.

    }, {
        key: 'addKnot',
        value: function addKnot(portalId1, portalId2) {
            var knots = this._knots;
            var portals = this._portals;
            var portalsToKnots = this._portalsToKnots;

            // Check portals.
            var portal1 = portals.get(portalId1);
            var portal2 = portals.get(portalId2);
            if (!portal1) return;

            // Check already linked.
            if (portalsToKnots.has(portalId1)) return;
            if (portal2 && portalsToKnots.has(portalId2)) return;

            // Create knot & link portals.
            var id = _collections2.default.generateId(knots);
            var knot = new _knot2.default(id, portal1, portal2);

            // Create in model.
            knots.set(id, knot);
            portalsToKnots.set(knot.portal1.id, knot);
            portalsToKnots.set(knot.portal2.id, knot);

            return knot;
        }

        /** Remove **/

    }, {
        key: 'removePortalFromPosition',
        value: function removePortalFromPosition(worldId, x, y, z) {
            // TODO [CRIT] worldify
        }
    }, {
        key: 'removePortal',
        value: function removePortal(portalId) {
            // Unlink and remove portal.
            var portalToKnots = this._portalsToKnots;
            var portals = this._portals;
            var portal = portals.get(portalId);
            if (!portal) return;

            var knot = portalToKnots.get(portalId);

            if (knot) {
                var otherEnd = knot.otherEnd(portal);

                if (otherEnd) knot.removePortal(portal);else this._knots.delete(otherEnd.id);

                portalToKnots.delete(portalId);
            }

            portals.delete(portalId);
            // TODO [OPTIM] compute connected components in 4D manifold
            this._cachedConnectivity = [new _map2.default(), new _map2.default()];
        }
    }, {
        key: 'removeKnot',
        value: function removeKnot(knotId) {
            // Unlink portals.
            var knots = this._knots;
            var portalToKnots = this._portalsToKnots;
            var knot = knots.get(knotId);

            if (knot) {
                var end1 = knot.portal1;
                var end2 = knot.portal2;

                if (end1) {
                    portalToKnots.remove(end1.id);
                }
                if (end2) {
                    portalToKnots.remove(end2.id);
                }

                knots.remove(knotId);
            }

            // Invalidate cache.
            // THOUGHT [OPTIM] think of a wiser invalidation method.
            this._cachedConnectivity = [new _map2.default(), new _map2.default()];
        }

        /** Get **/

    }, {
        key: 'getPortal',
        value: function getPortal(portalId) {
            portalId = parseInt(portalId);
            return this._portals.get(portalId);
        }
    }, {
        key: 'chunkContainsPortal',
        value: function chunkContainsPortal(worldId, chunkId, portalId) {
            worldId = parseInt(worldId);
            var ctp = this._worldToChunksToPortals.get(worldId);
            if (!ctp) return false;
            var p = ctp.get(chunkId);
            if (!p) return false;
            return p.has(portalId);
        }
    }, {
        key: 'getPortalsFromChunk',
        value: function getPortalsFromChunk(worldId, chunkId) {
            worldId = parseInt(worldId);
            var ctp = this._worldToChunksToPortals.get(worldId);
            if (!ctp) return null;
            return ctp.get(chunkId);
        }
    }, {
        key: 'getOtherSide',
        value: function getOtherSide(portalId) {
            portalId = parseInt(portalId);
            var p = this._portals.get(portalId);
            if (!p) return;
            var k = this._portalsToKnots.get(portalId);
            if (!k) return;
            return k.otherEnd(p);
        }

        // Returns a Map portalId -> [otherEndId, otherWorldId]
        // THOUGHT 1 [OPTIM] cache deepest request, then filter cached requests from then on

        // THOUGHT 2 [OPTIM] optimize time with memory.
        // Every time a portal is created, you add in an associative map
        // coordinates of both linked chunks (order is important).
        // Then you can compute offsets for two chunks in different worlds (just take
        // min distance by considering all possible combinations of ways going through superposed chunks).
        // A way to do it efficiently is to keep a Voronoi-like structure that emulate a geographical sorting of gates,
        // along with a sorted list of distance further between any pair of 4D subworlds.
        // Affectation can be solved by Munkres' algorithm.

    }, {
        key: 'getConnectivity',
        value: function getConnectivity(startWid, startCid, wModel, thresh, force) {
            var _this = this;

            if (!force && this._portals.size < 1) return; // Quite often.

            // Request cache.
            var aggregate = startWid + ';' + startCid + ';' + thresh;
            var cached1 = this._cachedConnectivity[0].get(aggregate);
            var cached2 = this._cachedConnectivity[1].get(aggregate);
            if (cached1 && cached2) return [cached1, cached2];

            var recursedPortals = new _map2.default();
            var recursedChunks = [];

            // BFS.
            var marks = new _set2.default();
            var depth = 0;
            var count = 0;
            var stack = [[startWid, startCid, depth]];

            var _loop = function _loop() {
                var element = stack.shift();
                var currentWorld = element[0];
                var currentChunk = element[1];
                var currentDepth = element[2];

                var marksId = currentWorld + ',' + currentChunk;
                if (marks.has(marksId)) return 'continue';
                marks.add(marksId);
                recursedChunks.push([currentWorld, currentChunk, currentDepth]);
                count++;

                depth = currentDepth;
                var world = wModel.getWorld(currentWorld);
                var ijk = currentChunk.split(',');
                var i = parseInt(ijk[0]),
                    j = parseInt(ijk[1]),
                    k = parseInt(ijk[2]);
                var chks = [i + 1 + ',' + j + ',' + k, i - 1 + ',' + j + ',' + k, i + ',' + (j + 1) + ',' + k, i + ',' + (j - 1) + ',' + k, i + ',' + j + ',' + (k + 1), i + ',' + j + ',' + (k - 1)];

                // TODO [HIGH] discriminate depth k+ and k-
                chks.forEach(function (c) {
                    if (!marks.has(currentWorld + ',' + c)) stack.push([currentWorld, c, currentDepth + 1]);
                });

                var gates = _this.getPortalsFromChunk(currentWorld, currentChunk);
                if (gates) {
                    gates.forEach(function (g) {
                        var currentPortal = _this.getPortal(g);
                        var otherSide = _this.getOtherSide(g);
                        if (!otherSide) {
                            recursedPortals.set(g, [null, currentPortal.chunkId, currentPortal.worldId].concat((0, _toConsumableArray3.default)(currentPortal.state)));
                        } else {
                            var otherChunk = otherSide.chunk;
                            if (XModel.debug) console.log("origin: world " + currentPortal.worldId + ", portal " + currentPortal.id);
                            if (XModel.debug) console.log("destin: world " + otherSide.worldId + ", portal " + otherSide.id);
                            recursedPortals.set(g, [otherSide.id, currentPortal.chunkId, currentPortal.worldId].concat((0, _toConsumableArray3.default)(currentPortal.state)));
                            if (otherChunk) {
                                var otherWorld = otherChunk.world.worldId;
                                var otherChunkId = otherChunk.chunkId;
                                if (!marks.has(otherWorld + ',' + otherChunkId)) stack.push([otherWorld, otherChunkId, currentDepth + 1]);
                            }
                        }
                    });
                }

                // Usually (always, I think) already sorted.
                // But it's important to keep it sorted. Make sure.
                stack.sort(function (a, b) {
                    return a[2] - b[2];
                });
            };

            while (stack.length > 0 && depth < thresh) {
                var _ret = _loop();

                if (_ret === 'continue') continue;
            }

            if (XModel.debug) console.log(count + ' iterations on ' + startWid + '/' + startCid + '/' + thresh);

            this._cachedConnectivity[0].set(aggregate, recursedPortals);
            this._cachedConnectivity[1].set(aggregate, recursedChunks);
            return [recursedPortals, recursedChunks];
        }
    }]);
    return XModel;
}();

XModel.debug = false;
exports.default = XModel;
//# sourceMappingURL=model.js.map
