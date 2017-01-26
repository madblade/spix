/**
 * Server app main logic.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _factory = require('./model/factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var App = function () {
    function App() {
        (0, _classCallCheck3.default)(this, App);

        this._hub = _factory2.default.createHub(this);
        this._connection = _factory2.default.createConnection(this);
    }

    // Model


    (0, _createClass3.default)(App, [{
        key: 'connect',
        value: function connect(socketio) {
            this._connection.configure(socketio);
        }
    }, {
        key: 'hub',
        get: function get() {
            return this._hub;
        }
    }, {
        key: 'connection',
        get: function get() {
            return this._connection;
        }
    }]);
    return App;
}();

exports.default = App;
//# sourceMappingURL=app.js.map
