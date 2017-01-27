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

var _solver = require('./solver/solver');

var _solver2 = _interopRequireDefault(_solver);

var _updater = require('./updater/updater');

var _updater2 = _interopRequireDefault(_updater);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PhysicsEngine = function () {
    function PhysicsEngine(game) {
        (0, _classCallCheck3.default)(this, PhysicsEngine);

        // Models.
        this._entityModel = game.entityModel;
        this._worldModel = game.worldModel;
        this._xModel = game.xModel;

        // Buffers.
        this._inputBuffer = new _input_buffer2.default();
        this._outputBuffer = new _output_buffer2.default();

        // Engine.
        this._updater = new _updater2.default(this); // Parses input and updates model constraints.
        this._solver = new _solver2.default(this); // Updates physical model.
    }

    (0, _createClass3.default)(PhysicsEngine, [{
        key: 'addInput',
        value: function addInput(meta, avatar) {
            this._inputBuffer.addInput(meta, avatar);
        }
    }, {
        key: 'update',
        value: function update() {
            this._updater.update(this._inputBuffer.getInput());

            this._solver.solve();

            this._inputBuffer.flush();
        }
    }, {
        key: 'getOutput',
        value: function getOutput() {
            return this._outputBuffer.getOutput();
        }
    }, {
        key: 'flushOutput',
        value: function flushOutput() {
            this._outputBuffer.flushOutput(this._entityModel.entities);
        }
    }, {
        key: 'shuffleGravity',
        value: function shuffleGravity() {
            this._solver.shuffleGravity();
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
        key: 'outputBuffer',
        get: function get() {
            return this._outputBuffer;
        }
    }]);
    return PhysicsEngine;
}();

exports.default = PhysicsEngine;
//# sourceMappingURL=physics.js.map
