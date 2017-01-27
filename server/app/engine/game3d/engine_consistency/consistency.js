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

var _buffer_chunk = require('./buffer_chunk');

var _buffer_chunk2 = _interopRequireDefault(_buffer_chunk);

var _buffer_entity = require('./buffer_entity');

var _buffer_entity2 = _interopRequireDefault(_buffer_entity);

var _loader_chunk = require('./loader/loader_chunk');

var _loader_chunk2 = _interopRequireDefault(_loader_chunk);

var _loader_entity = require('./loader/loader_entity');

var _loader_entity2 = _interopRequireDefault(_loader_entity);

var _generator = require('./generator/generator');

var _generator2 = _interopRequireDefault(_generator);

var _updater = require('./updater/updater');

var _updater2 = _interopRequireDefault(_updater);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ConsistencyEngine = function () {
    function ConsistencyEngine(game) {
        (0, _classCallCheck3.default)(this, ConsistencyEngine);

        this._game = game;

        // Models.
        this._entityModel = game.entityModel;
        this._worldModel = game.worldModel;
        this._xModel = game.xModel;
        this._consistencyModel = game.consistencyModel;

        // Buffers.
        this._chunkBuffer = new _buffer_chunk2.default();
        this._entityBuffer = new _buffer_entity2.default();

        // Other engines.
        this._physicsEngine = game.physicsEngine;
        this._topologyEngine = game.topologyEngine;

        // Internal engine.
        this._generator = new _generator2.default(this);
        this._chunkLoader = new _loader_chunk2.default(this);
        this._entityLoader = new _loader_entity2.default(this);
        this._updater = new _updater2.default(this);
    }

    (0, _createClass3.default)(ConsistencyEngine, [{
        key: 'spawnPlayer',


        // On connection / disconnection.
        value: function spawnPlayer(player) {
            this._entityModel.spawnPlayer(player);
            this._consistencyModel.spawnPlayer(player);
            this._entityBuffer.spawnPlayer(player);
        }
    }, {
        key: 'despawnPlayer',
        value: function despawnPlayer(playerId) {
            this._entityBuffer.removePlayer(playerId);
            this._consistencyModel.removePlayer(playerId);
            this._entityModel.removePlayer(playerId);
        }
    }, {
        key: 'addInput',
        value: function addInput(meta, avatar) {
            this._updater.addInput(meta, avatar);
        }
    }, {
        key: 'update',
        value: function update() {
            this._updater.update();
        }
    }, {
        key: 'getChunkOutput',
        value: function getChunkOutput() {
            return this._chunkBuffer.getOutput();
        }
    }, {
        key: 'getEntityOutput',
        value: function getEntityOutput() {
            return this._entityBuffer.getOutput();
        }
    }, {
        key: 'getPlayerOutput',
        value: function getPlayerOutput() {
            return this._entityBuffer.addedPlayers;
        }
    }, {
        key: 'getXOutput',
        value: function getXOutput() {
            return this._updater.getOutput();
        }
    }, {
        key: 'flushBuffers',
        value: function flushBuffers() {
            this._chunkBuffer.flush();
            this._entityBuffer.flush();
            this._updater.flushBuffers();
        }

        // The first time, FORCE BUILD when output requests CE initial output.

    }, {
        key: 'initChunkOutputForPlayer',
        value: function initChunkOutputForPlayer(player) {
            var aid = player.avatar.id;
            var worldId = player.avatar.worldId;
            var worldModel = this._worldModel;
            var world = worldModel.getWorld(worldId);

            var cs = world.allChunks;
            var cm = this._consistencyModel;

            // Object.
            var chunkOutput = this._chunkLoader.computeChunksForNewPlayer(player);

            var addedW = {};
            for (var wid in chunkOutput) {
                if (!(wid in addedW)) {
                    var w = worldModel.getWorld(parseInt(wid));
                    addedW[wid] = [w.xSize, w.ySize, w.zSize];
                }
                var chunkIds = chunkOutput[wid];
                for (var cid in chunkIds) {
                    if (cs.has(cid)) cm.setChunkLoaded(aid, parseInt(wid), cid);
                }
            }

            chunkOutput['worlds'] = addedW;

            // WARN: idem, updates must be transmitted right after this call
            // otherwise its player will be out of sync.
            return chunkOutput;
        }

        // The first time, FORCE COMPUTE in-range entities when output requests CE output.

    }, {
        key: 'initEntityOutputForPlayer',
        value: function initEntityOutputForPlayer(player) {
            var aid = player.avatar.id;
            var es = this._entityModel.entities;
            var cm = this._consistencyModel;

            // Object.
            var entityOutput = this._entityLoader.computeEntitiesInRange(player);

            for (var eid in entityOutput) {
                if (es.has(eid)) cm.setEntityLoaded(aid, eid);
            } // Updates must be transmitted after this call.
            return entityOutput;
        }
    }, {
        key: 'generateWorld',
        value: function generateWorld() {
            return this._generator.generateWorld();
        }
    }, {
        key: 'game',
        get: function get() {
            return this._game;
        }
    }, {
        key: 'worldModel',
        get: function get() {
            return this._worldModel;
        }
    }, {
        key: 'entityModel',
        get: function get() {
            return this._entityModel;
        }
    }, {
        key: 'xModel',
        get: function get() {
            return this._xModel;
        }
    }, {
        key: 'consistencyModel',
        get: function get() {
            return this._consistencyModel;
        }
    }, {
        key: 'physicsEngine',
        get: function get() {
            return this._physicsEngine;
        }
    }, {
        key: 'chunkBuffer',
        get: function get() {
            return this._chunkBuffer;
        }
    }, {
        key: 'entityBuffer',
        get: function get() {
            return this._entityBuffer;
        }
    }, {
        key: 'chunkLoader',
        get: function get() {
            return this._chunkLoader;
        }
    }, {
        key: 'entityLoader',
        get: function get() {
            return this._entityLoader;
        }
    }]);
    return ConsistencyEngine;
}();

exports.default = ConsistencyEngine;
//# sourceMappingURL=consistency.js.map
