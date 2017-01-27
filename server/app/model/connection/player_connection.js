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

var _collections = require('../../engine/math/collections');

var _collections2 = _interopRequireDefault(_collections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PlayerConnection = function () {
    function PlayerConnection(socket) {
        (0, _classCallCheck3.default)(this, PlayerConnection);

        this._socket = socket;
        this._rooms = [];
        this._listeners = [];
    }

    (0, _createClass3.default)(PlayerConnection, [{
        key: 'send',
        value: function send(kind, data) {
            this._socket.emit(kind, data);
        }

        /**
         * Register custom socket behaviour.
         * @param message
         * @param behaviour
         */

    }, {
        key: 'on',
        value: function on(message, behaviour) {
            if (typeof behaviour !== "function") console.log("WARN: invalid socket definition");else {
                this._listeners.push(message);
                this._socket.on(message, behaviour);
            }
        }

        /**
         * Stop listening for a specific message.
         * @param message
         * @param behaviour the bound function
         */

    }, {
        key: 'off',
        value: function off(message, behaviour) {
            this._socket.off(message, behaviour);
            _collections2.default.removeFromArray(this._listeners, message);
        }

        // Remove all listeners.

    }, {
        key: 'offAll',
        value: function offAll() {
            var _this = this;

            this._listeners.forEach(function (message) {
                return _this._socket.removeAllListeners(message);
            });
            this._listeners = [];
        }

        /**
         * Join a specific chan.
         * @param room
         */

    }, {
        key: 'join',
        value: function join(room) {
            this._socket.join(room);
            this._rooms.push(room);
        }

        /**
         * Leave a specific chan.
         * @param room
         */

    }, {
        key: 'leave',
        value: function leave(room) {
            this._socket.leave(room);
            _collections2.default.removeFromArray(this._rooms, room);
        }

        // Leave all chans this player was connected to.

    }, {
        key: 'leaveAll',
        value: function leaveAll() {
            var _this2 = this;

            this._rooms.forEach(function (room) {
                return _this2._socket.leave(room);
            });
            this._rooms = [];
        }

        // Close connection: removes all listeners.

    }, {
        key: 'close',
        value: function close() {
            this.leaveAll();
            this.offAll();
        }

        // Make the object eligible for garbage collection.

    }, {
        key: 'destroy',
        value: function destroy() {
            this.close();
            delete this._socket;
            delete this._rooms;
            delete this._listeners;
        }
    }]);
    return PlayerConnection;
}();

exports.default = PlayerConnection;
//# sourceMappingURL=player_connection.js.map
