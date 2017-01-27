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

var _engine = require('./newton/engine');

var _engine2 = _interopRequireDefault(_engine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Solver = function () {
    function Solver(physicsEngine) {
        (0, _classCallCheck3.default)(this, Solver);

        // Models.
        this._entityModel = physicsEngine.entityModel;
        this._worldModel = physicsEngine.worldModel;

        // Output.
        this._outputBuffer = physicsEngine.outputBuffer;

        // Internals.
        this._stamp = process.hrtime();
    }

    (0, _createClass3.default)(Solver, [{
        key: 'solve',
        value: function solve() {
            var Δt = process.hrtime(this._stamp)[1];
            _engine2.default.solve(this, Δt);
            this._stamp = process.hrtime();
        }
    }, {
        key: 'shuffleGravity',
        value: function shuffleGravity() {
            var g = _engine2.default.gravity;
            _engine2.default.gravity = [g[2], g[0], g[1]];
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
    return Solver;
}();

exports.default = Solver;
//# sourceMappingURL=solver.js.map
