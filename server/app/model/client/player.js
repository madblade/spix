/**
 * Player model.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _factory = require('./../factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Player = function () {
    function Player(user, game) {
        (0, _classCallCheck3.default)(this, Player);

        this._user = user;
        this._game = game;
        // May be given an avatar when logged to a game.
        this._avatar = undefined;
        this._playerConnection = _factory2.default.createPlayerConnection(user.connection.socket);
    }

    // Model


    (0, _createClass3.default)(Player, [{
        key: 'join',


        /**
         * Join a socket room.
         * @param room Socket subset of users.
         */
        value: function join(room) {
            this._playerConnection.join(room);
        }

        /**
         * Send a message to this user.
         * @param kind
         * @param data
         */

    }, {
        key: 'send',
        value: function send(kind, data) {
            this._playerConnection.send(kind, data);
        }

        // Leave game and make the game forget.

    }, {
        key: 'leave',
        value: function leave() {
            this.disconnect();
            this._game.removePlayer(this);
        }

        // Close player connection.

    }, {
        key: 'disconnect',
        value: function disconnect() {
            this._playerConnection.close();
        }

        /**
         * Define custom interactions (see PlayerConnection).
         * @param message
         * @param behaviour
         */

    }, {
        key: 'on',
        value: function on(message, behaviour) {
            this._playerConnection.on(message, behaviour);
        }

        /**
         * Stop listening for a specified input type.
         * @param message
         * @param behaviour
         */

    }, {
        key: 'off',
        value: function off(message, behaviour) {
            this._playerConnection.off(message, behaviour);
        }

        // Clean references. Only use from a Game instance.

    }, {
        key: 'destroy',
        value: function destroy() {
            // Destroy player connection which is a single child of this object.
            if (this._playerConnection) this._playerConnection.destroy();
            delete this._playerConnection;
            delete this._game;
            delete this._user;
        }
    }, {
        key: 'game',
        get: function get() {
            return this._game;
        }
    }, {
        key: 'user',
        get: function get() {
            return this._user;
        }
    }]);
    return Player;
}();

exports.default = Player;
//# sourceMappingURL=player.js.map
