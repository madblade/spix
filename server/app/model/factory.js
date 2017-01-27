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

var _user_db = require('./client/user_db');

var _user_db2 = _interopRequireDefault(_user_db);

var _hub = require('./game/hub');

var _hub2 = _interopRequireDefault(_hub);

var _user = require('./client/user');

var _user2 = _interopRequireDefault(_user);

var _player = require('./client/player');

var _player2 = _interopRequireDefault(_player);

var _player_manager = require('./client/player_manager');

var _player_manager2 = _interopRequireDefault(_player_manager);

var _connection = require('./connection/connection');

var _connection2 = _interopRequireDefault(_connection);

var _user_connection = require('./connection/user_connection');

var _user_connection2 = _interopRequireDefault(_user_connection);

var _player_connection = require('./connection/player_connection');

var _player_connection2 = _interopRequireDefault(_player_connection);

var _game = require('./game/game');

var _game2 = _interopRequireDefault(_game);

var _factory = require('../engine/factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Factory = function () {
    function Factory() {
        (0, _classCallCheck3.default)(this, Factory);
    }

    (0, _createClass3.default)(Factory, null, [{
        key: 'createUserDB',


        /** App-level classes */

        value: function createUserDB(connector) {
            return new _user_db2.default(connector);
        }
    }, {
        key: 'createHub',
        value: function createHub(app) {
            return new _hub2.default(app);
        }
    }, {
        key: 'createUser',
        value: function createUser(hub, socket, nick, id) {
            return new _user2.default(hub, socket, nick, id);
        }

        /** Gaming classes */

    }, {
        key: 'createGame',
        value: function createGame(hub, kind, gameId, connector) {
            return _factory2.default.createGame(hub, kind, gameId, connector);
        }
    }, {
        key: 'createPlayer',
        value: function createPlayer(user, game) {
            return new _player2.default(user, game);
        }
    }, {
        key: 'createPlayerManager',
        value: function createPlayerManager() {
            return new _player_manager2.default();
        }

        /** Connection classes */

    }, {
        key: 'createConnection',
        value: function createConnection(app) {
            return new _connection2.default(app);
        }
    }, {
        key: 'createUserConnection',
        value: function createUserConnection(user, socket) {
            return new _user_connection2.default(user, socket);
        }
    }, {
        key: 'createPlayerConnection',
        value: function createPlayerConnection(socket) {
            return new _player_connection2.default(socket);
        }
    }]);
    return Factory;
}();

exports.default = Factory;
//# sourceMappingURL=factory.js.map
