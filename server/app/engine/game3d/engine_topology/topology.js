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

var _input_buffer = require('./input_buffer');

var _input_buffer2 = _interopRequireDefault(_input_buffer);

var _output_buffer = require('./output_buffer');

var _output_buffer2 = _interopRequireDefault(_output_buffer);

var _selector = require('./selector/selector');

var _selector2 = _interopRequireDefault(_selector);

var _updater = require('./updater/updater');

var _updater2 = _interopRequireDefault(_updater);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TopologyEngine = function () {
    function TopologyEngine(game) {
        (0, _classCallCheck3.default)(this, TopologyEngine);

        // Models.
        this._entityModel = game.entityModel;
        this._worldModel = game.worldModel;
        this._xModel = game.xModel;
        this._consistencyModel = game.consistencyModel;

        // Buffers.
        this._inputBuffer = new _input_buffer2.default();
        this._outputBuffer = new _output_buffer2.default();

        // Engine.
        this._selector = new _selector2.default(this); // Extracts subsets for players.
        this._updater = new _updater2.default(this); // Updates model. Needs Accessor.
    }

    (0, _createClass3.default)(TopologyEngine, [{
        key: 'addInput',
        value: function addInput(meta, avatar) {
            // Security: copy avatar state before physics engine updates positions and world translations.
            var pos = avatar.position;
            var secureAvatar = { position: [pos[0], pos[1], pos[2]], worldId: avatar.worldId };

            this._inputBuffer.addInput(meta, secureAvatar);
        }
    }, {
        key: 'update',
        value: function update() {
            this._updater.update(this._inputBuffer.getInput());
            this._inputBuffer.flush();
        }

        // Get (chunk id, blocks) map for updated chunks.

    }, {
        key: 'getOutput',
        value: function getOutput() {
            return this._outputBuffer.getOutput();
        }

        // Get (chunk id, updates) object for updated chunks concerning specific player.
        // TODO [HIGH] put in consistency model.

    }, {
        key: 'getOutputForPlayer',
        value: function getOutputForPlayer(p, updatedChunks, newChunks) {
            var worldModel = this._worldModel;
            var consistencyModel = this._consistencyModel;
            return this._selector.selectUpdatedChunksForPlayer(p, worldModel, consistencyModel, updatedChunks, newChunks);
        }
    }, {
        key: 'flushOutput',
        value: function flushOutput() {
            this._outputBuffer.flushOutput(this._worldModel);
        }
    }, {
        key: 'entityModel',
        get: function get() {
            return this._entityModel;
        }
    }, {
        key: 'worldModel',
        get: function get() {
            return this._worldModel;
        }
    }, {
        key: 'selector',
        get: function get() {
            return this._selector;
        }
    }, {
        key: 'outputBuffer',
        get: function get() {
            return this._outputBuffer;
        }
    }]);
    return TopologyEngine;
}();

exports.default = TopologyEngine;
//# sourceMappingURL=topology.js.map
