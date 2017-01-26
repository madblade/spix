/**
 *
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

var _updater_x = require('./updater_x');

var _updater_x2 = _interopRequireDefault(_updater_x);

var _loader_x = require('../loader/loader_x');

var _loader_x2 = _interopRequireDefault(_loader_x);

var _buffer_x = require('../buffer_x');

var _buffer_x2 = _interopRequireDefault(_buffer_x);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Updater = function () {
    function Updater(consistencyEngine) {
        (0, _classCallCheck3.default)(this, Updater);


        // Model.
        this._game = consistencyEngine.game;
        this._worldModel = consistencyEngine.worldModel;
        this._consistencyModel = consistencyEngine.consistencyModel;

        // Engine.
        this._physicsEngine = consistencyEngine.physicsEngine;
        this._chunkBuffer = consistencyEngine.chunkBuffer;
        this._entityBuffer = consistencyEngine.entityBuffer;
        this._chunkLoader = consistencyEngine.chunkLoader;
        this._entityLoader = consistencyEngine.entityLoader;

        // xEngine.
        this._xUpdater = new _updater_x2.default(consistencyEngine);
        this._xLoader = new _loader_x2.default(consistencyEngine);
        this._xBuffer = new _buffer_x2.default();

        // X creation/deletion buffer.
        this._inputBuffer = [];
    }

    (0, _createClass3.default)(Updater, [{
        key: 'addInput',
        value: function addInput(meta, avatar) {
            this._inputBuffer.push([avatar, meta]);
        }
    }, {
        key: 'update',
        value: function update() {
            // User-send updates (mainly x).
            this.processBuffer();

            // Compute aggregates to send.
            this.updateConsistency();
        }
    }, {
        key: 'processBuffer',
        value: function processBuffer() {
            var buffer = this._inputBuffer;
            var xUpdater = this._xUpdater;

            buffer.forEach(function (x) {
                // console.log(x[0]); // Avatar
                console.log(x[1]); // { action: 'gate', meta: [ 'add', -2, 6, -16, portalToLinkId ] }
                xUpdater.update(x[0], x[1]);
            });

            // Flush X INPUT (BEFORE SEND UPDATE).
            this._inputBuffer = [];
        }

        // Get X output

    }, {
        key: 'getOutput',
        value: function getOutput() {
            return this._xBuffer.getOutput();
        }

        // Flush X OUTPUT (AFTER SEND UPDATER).

    }, {
        key: 'flushBuffers',
        value: function flushBuffers() {
            this._xBuffer.flush();
        }

        // This only takes care of LOADING things with respect to players.
        // (entities, chunks)
        // The Output class directly manages CHANGING things.
        // (it gets outputs from TopologyEngine and PhysicsEngine, then transmits them to players)
        // Loading and unloading objects is done exclusively here.
        // Single criterion for maintaining loaded objects consistent: distance.
        // (objects are initialized with STATES so they don't need updates)

    }, {
        key: 'updateConsistency',
        value: function updateConsistency() {
            var players = this._game.players;

            // Get buffers.
            var cbuf = this._chunkBuffer;
            var ebuf = this._entityBuffer;
            var xbuf = this._xBuffer;

            // Model and engines.
            var worldModel = this._worldModel;
            var consistencyModel = this._consistencyModel;
            var updatedEntities = this._physicsEngine.getOutput();
            var addedPlayers = this._entityBuffer.addedPlayers;
            var removedPlayers = this._entityBuffer.removedPlayers;

            // Loaders
            var eLoader = this._entityLoader;
            var cLoader = this._chunkLoader;
            var xLoader = this._xLoader;

            // Object iterator.
            var forEach = function forEach(object, callback) {
                for (var id in object) {
                    callback(id);
                }
            };

            // For each player...
            var t = process.hrtime();
            var dt1 = void 0;
            players.forEach(function (p) {
                if (p.avatar) {
                    (function () {

                        var pid = p.avatar.id;

                        // Compute change for entities in range.
                        var addedEntities = void 0,
                            removedEntities = void 0,
                            u = eLoader.computeNewEntitiesInRange(p, updatedEntities, addedPlayers, removedPlayers);

                        if (u) {
                            ;

                            var _u = (0, _slicedToArray3.default)(u, 2);

                            addedEntities = _u[0];
                            removedEntities = _u[1];
                        } // TODO [MEDIUM] filter: updated entities and entities that enter in range.

                        dt1 = process.hrtime(t)[1] / 1000;
                        if (Updater.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Entities.');
                        t = process.hrtime();

                        // Compute change for chunks in range.
                        var addedChunks = void 0,
                            removedChunks = void 0,
                            v = cLoader.computeNewChunksInRange(p);
                        if (v) {
                            ;

                            var _v = (0, _slicedToArray3.default)(v, 2);

                            addedChunks = _v[0];
                            removedChunks = _v[1];
                        }dt1 = process.hrtime(t)[1] / 1000;
                        if (Updater.bench && dt1 > 1000) console.log('\t' + dt1 + ' computeNew Chunks.');
                        t = process.hrtime();

                        var addedX = void 0,
                            removedX = void 0,
                            addedW = void 0,
                            x = xLoader.computeNewXInRange(p);
                        if (x) {
                            ;

                            var _x = (0, _slicedToArray3.default)(x, 2);

                            addedX = _x[0];
                            removedX = _x[1];
                        } // Update consistency model.
                        // WARN: updates will only be transmitted during next output pass.
                        // BE CAREFUL HERE
                        if (addedEntities) forEach(addedEntities, function (e) {
                            return consistencyModel.setEntityLoaded(pid, parseInt(e));
                        });
                        if (removedEntities) forEach(removedEntities, function (e) {
                            return consistencyModel.setEntityOutOfRange(pid, parseInt(e));
                        });

                        if (addedX) forEach(addedX, function (x) {
                            return consistencyModel.setXLoaded(pid, parseInt(x));
                        });
                        if (removedX) forEach(removedX, function (x) {
                            return consistencyModel.setXOutOfRange(pid, parseInt(x));
                        });

                        if (addedChunks) {
                            addedW = {};
                            forEach(addedChunks, function (wid) {
                                if (!(wid in addedW)) {
                                    var w = worldModel.getWorld(parseInt(wid));
                                    addedW[wid] = [w.xSize, w.ySize, w.zSize];
                                }
                                forEach(addedChunks[wid], function (c) {
                                    consistencyModel.setChunkLoaded(pid, parseInt(wid), c);
                                });
                            });
                        }
                        if (removedChunks) forEach(removedChunks, function (wid) {
                            forEach(removedChunks[wid], function (c) {
                                return consistencyModel.setChunkOutOfRange(pid, parseInt(wid), c);
                            });
                        });

                        // Update output buffers.
                        if (addedChunks || removedChunks) cbuf.updateChunksForPlayer(pid, addedChunks, removedChunks, addedW);
                        if (addedEntities || removedEntities) ebuf.updateEntitiesForPlayer(pid, addedEntities, removedEntities);
                        if (addedX || removedX) xbuf.updateXForPlayer(pid, addedX, removedX);
                    })();
                }
            });
        }
    }]);
    return Updater;
}();

Updater.bench = false;
exports.default = Updater;
//# sourceMappingURL=updater.js.map
