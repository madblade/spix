/**
 * DB.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _factory = require('./../factory');

var _factory2 = _interopRequireDefault(_factory);

var _collections = require('../../engine/math/collections');

var _collections2 = _interopRequireDefault(_collections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UserDataBase = function () {
    function UserDataBase(connector) {
        (0, _classCallCheck3.default)(this, UserDataBase);

        this._connection = connector;
        this._users = new _map2.default();
    }

    (0, _createClass3.default)(UserDataBase, [{
        key: 'containsUser',
        value: function containsUser(user) {
            return this._users.has(user.id);
        }

        /**
         * Injects a socket into the user model.
         * Registers the user (a socket knows its user since the connection).
         * @param socket
         */

    }, {
        key: 'registerUser',
        value: function registerUser(socket) {
            var users = this._users;
            var nick = "";
            var id = _collections2.default.generateId(users);
            var hub = this._connection.hub;
            var user = _factory2.default.createUser(hub, socket, nick, id);

            users.set(id, user);
            return user;
        }
    }, {
        key: 'getUser',
        value: function getUser(id) {
            return this._users.get(id);
        }
    }, {
        key: 'removeUser',
        value: function removeUser(user) {
            // Remove references to this user
            this._users.delete(user.id);
            user.destroy();
        }
    }, {
        key: 'notifyGameCreation',
        value: function notifyGameCreation(kind, id) {
            var game = {};
            game[kind] = [id];

            var users = this._users;
            users.forEach(function (user, userId) {
                user.send('hub', (0, _stringify2.default)(game));
            });
        }
    }]);
    return UserDataBase;
}();

exports.default = UserDataBase;
//# sourceMappingURL=user_db.js.map
