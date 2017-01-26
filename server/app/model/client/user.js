/**
 * User model.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _factory = require('./../factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var User = function () {
    function User(hub, socket, nick, id) {
        (0, _classCallCheck3.default)(this, User);

        // Model
        this._hub = hub;
        this._userConnection = _factory2.default.createUserConnection(this, socket);
        this._nick = nick;
        this._id = id;

        // States
        this._ingame = false;
        this._player = null;
    }

    // Model


    (0, _createClass3.default)(User, [{
        key: 'send',


        // Send a message to this user through its UserConnection.
        value: function send(kind, data) {
            this._userConnection.send(kind, data);
        }

        // Requests the hub to create a new gaming pool.

    }, {
        key: 'requestNewGame',
        value: function requestNewGame(data) {
            return this._hub.requestNewGame(this, data);
        }

        // Join a specific game.

    }, {
        key: 'join',
        value: function join(kind, gameId) {
            gameId = parseInt(gameId);

            this._ingame = true;
            var game = this._hub.getGame(kind, gameId);
            if (!game) return false;

            // Stop listening for general game management events...
            // Prevents the user from joining multiple games.
            this._userConnection.idle();

            // Create a player associated to this game and spawn it
            var player = _factory2.default.createPlayer(this, game);
            this._player = player;
            game.addPlayer(player);
            return true;
        }
    }, {
        key: 'fetchHubState',
        value: function fetchHubState() {
            var games = this._hub.listGames();
            if ((0, _keys2.default)(games).length < 1) {
                this._userConnection.send('hub', (0, _stringify2.default)(games));
                return;
            }

            for (var kind in games) {
                if (games[kind] instanceof Array && games[kind].length > 0) {
                    this._userConnection.send('hub', (0, _stringify2.default)(games));
                    return;
                }
            }
        }

        // Leave all games (current game). Stay idle.

    }, {
        key: 'leave',
        value: function leave() {
            this._ingame = false;
            if (this._player) {
                this._player.leave();
                this._player.destroy(); // OK given player.leave() was called
                // So player does not belong to its game model.
                this._player = null;
            }
            this._userConnection.listen();
        }

        // Disconnect from ingame socket. Stay inside game model.
        // Maybe the connection will come back.

    }, {
        key: 'disconnect',
        value: function disconnect() {
            // Do not destroy player (account for unexpected disconnections)
            if (this._player) this._player.disconnect();
        }

        // Clean references.

    }, {
        key: 'destroy',
        value: function destroy() {
            this._userConnection.destroy();
            // Do not destroy player before its game ends.
            // Useful for user reconnection...
            // if (this._player) this._player.destroy();

            delete this._userConnection;
            delete this._player;
            delete this._hub;
            delete this._nick;
            delete this._id;
            delete this._ingame;
        }
    }, {
        key: 'hub',
        get: function get() {
            return this._hub;
        }
    }, {
        key: 'id',
        get: function get() {
            return this._id;
        }
    }, {
        key: 'connection',
        get: function get() {
            return this._userConnection;
        }
    }, {
        key: 'nick',
        get: function get() {
            return this._nick;
        },
        set: function set(nick) {
            this._nick = nick;
        }
    }, {
        key: 'ingame',
        get: function get() {
            return this._ingame;
        },
        set: function set(value) {
            if (value) this._ingame = value;
        }
    }]);
    return User;
}();

exports.default = User;
//# sourceMappingURL=user.js.map
