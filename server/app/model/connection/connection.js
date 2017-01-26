/**
 * Custom socket communication layer.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _factory = require('../factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Connector = function () {
    function Connector(app) {
        (0, _classCallCheck3.default)(this, Connector);

        this._app = app;
        this._userDB = _factory2.default.createUserDB(this);
        this._io = null;
        this._debug = false;
    }

    // Model


    (0, _createClass3.default)(Connector, [{
        key: 'setupUser',


        // When the user connects, register him
        value: function setupUser(socket) {
            // Add user to app DB
            var user = this._userDB.registerUser(socket);

            // A user knows its socket and reciprocally
            socket.user = user;

            // Inform the user that its connection is established
            // Make him wait a little... Server does not hurry.
            setTimeout(function (_) {
                return socket.emit('connected', '');
            }, 400);
        }
    }, {
        key: 'setupDisconnect',
        value: function setupDisconnect(socket) {
            var _this = this;

            // Setup off util function
            socket.off = socket.removeListener;

            // Call onDisconnect.
            socket.on('disconnect', function (_) {
                var user = socket.user;
                if (user === undefined) return;

                // Leave from any running game.
                user.leave(); // First disconnects then makes the game forget.

                // Destroy user.
                _this._userDB.removeUser(user);

                if (_this._debug) socket.log('DISCONNECTED');
            });
        }
    }, {
        key: 'setupDebug',
        value: function setupDebug(socket) {
            this._debug = true;

            socket.address = socket.request.connection.remoteAddress + ':' + socket.request.connection.remotePort;

            socket.connectedAt = new Date();

            socket.log = function () {
                var _console;

                for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
                    data[_key] = arguments[_key];
                }

                (_console = console).log.apply(_console, ['SocketIO ' + socket.nsp.name + ' [' + socket.address + ']'].concat(data));
            };

            // When the client emits 'info', this listens and executes
            socket.on('info', function (data) {
                socket.log((0, _stringify2.default)(data, null, 2));
            });
        }

        /**
         * Configure socket connections.
         *
         * socket.io (v1.x.x) is powered by debug.
         *
         * In order to see all the debug output, set DEBUG
         * (in server/config/local.env.js) to including the desired scope.
         * (don't forget to import config from './environment' ;)
         * ex: DEBUG: "http*,socket.io:socket"
         *
         * We can authenticate socket.io users and access their token through socket.decoded_token
         * 1. You will need to send the token in `client/components/socket/socket.service.js`
         * 2. Require authentication here:
         *      socketio.use(require('socketio-jwt').authorize({
         *          secret: config.secrets.session,
         *          handshake: true
         *      }));
         *
         * @param socketio
         */

    }, {
        key: 'configure',
        value: function configure(socketio) {
            var _this2 = this;

            if (this._io) throw new Error("Trying to configure a running app.");

            this._io = socketio;

            socketio.on('connection', function (socket) {
                // Define debug functions and attributes
                _this2.setupDebug(socket);

                // Define disconnect behaviour
                _this2.setupDisconnect(socket);

                // Register user
                _this2.setupUser(socket);

                if (_this2._debug) socket.log('CONNECTED');
            });
        }
    }, {
        key: 'hub',
        get: function get() {
            return this._app.hub;
        }
    }, {
        key: 'io',
        get: function get() {
            return this._io;
        }
    }, {
        key: 'db',
        get: function get() {
            return this._userDB;
        }
    }]);
    return Connector;
}();

exports.default = Connector;
//# sourceMappingURL=connection.js.map
