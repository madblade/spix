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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UserConnection = function () {
    function UserConnection(user, socket) {
        (0, _classCallCheck3.default)(this, UserConnection);

        this._user = user;
        this._socket = socket;

        this.listen();
    }

    // Model


    (0, _createClass3.default)(UserConnection, [{
        key: 'send',
        value: function send(kind, data) {
            this._socket.emit(kind, data);
        }

        // Game & hub management.

    }, {
        key: 'listen',
        value: function listen() {
            // Use a unique channel for util functions
            // Actions are specified within the data
            this._socket.on('util', this.onUserRequest.bind(this));
        }

        // Drawback: switch potentially evaluates all statements
        // Advantage: does not loads the socket with many listeners

    }, {
        key: 'onUserRequest',
        value: function onUserRequest(data) {
            switch (data.request) {

                // A user can ask the hub for a new game to be created.
                case 'createGame':
                    if (data.hasOwnProperty('gameType')) this.handleCreateGame(data.gameType);
                    break;

                // A user can join a specific game (given a kind and id).
                case 'joinGame':
                    console.log('A player tries to join');
                    if (!data.hasOwnProperty('gameId') || !data.hasOwnProperty('gameType') || !data.gameId || !data.gameType || !this.handleJoinGame(data)) {
                        this.send('cantjoin', 'foo');
                    }
                    break;

                // A user can ask for the list of all available games.
                case 'hub':
                    this.handleGetHubState();
                    break;
            }
        }
    }, {
        key: 'handleCreateGame',
        value: function handleCreateGame(kind) {
            var created = this._user.requestNewGame(kind);
            if (created) console.log('Created new game.');
            return created;
        }
    }, {
        key: 'handleJoinGame',
        value: function handleJoinGame(data) {
            var joined = this._user.join(data.gameType, data.gameId);
            if (joined) this.send('joined', 'foo');
            return joined;
        }
    }, {
        key: 'handleGetHubState',
        value: function handleGetHubState() {
            this._user.fetchHubState();
        }
    }, {
        key: 'idle',
        value: function idle() {
            this._socket.off('util', this.onUserRequest.bind(this));
        }

        // Clean references.

    }, {
        key: 'destroy',
        value: function destroy() {
            this.idle();
            delete this._user;
            delete this._socket;
        }
    }, {
        key: 'user',
        get: function get() {
            return this._user;
        },
        set: function set(user) {
            this._user = user;
        }
    }, {
        key: 'socket',
        get: function get() {
            return this._socket;
        }
    }]);
    return UserConnection;
}();

exports.default = UserConnection;
//# sourceMappingURL=user_connection.js.map
