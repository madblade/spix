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

var Chat = function () {
    function Chat(game) {
        (0, _classCallCheck3.default)(this, Chat);

        this._game = game;
        this._temporaryMessages = [];
    }

    (0, _createClass3.default)(Chat, [{
        key: 'log',
        value: function log(message) {
            console.log('On ' + this._game.gameId + ': ' + message);
        }
    }, {
        key: 'hasMessages',
        value: function hasMessages() {
            return this._temporaryMessages.length > 0;
        }
    }, {
        key: 'updateOutput',
        value: function updateOutput() {
            // TODO [LOW] transmit updates to clients.
            if (this.hasMessages()) {
                // broadcast('chat', ...)
            }
        }

        /**
         * @param player
         * A player knows its user (player.user)
         * A user has an id (user.id)
         * @returns {Function}
         */

    }, {
        key: 'playerInput',
        value: function playerInput(player) {
            var _this = this;

            // TODO [LOW] log input into temporaryMessages.
            return function (data) {
                // Important: don't send responses immediately on input.
                // Store history of received messages in a temporary variable,
                // then wait for server to call 'updateOutput' method after it
                // has finished rendering current game state.
                _this.log('received message ' + data + ' from ' + player.user.id);
            };
        }
    }, {
        key: 'broadcast',
        value: function broadcast(kind, data) {
            var game = this._game;
            game.connection.io.to(game.gameId).emit(kind, data);
        }
    }]);
    return Chat;
}();

exports.default = Chat;
//# sourceMappingURL=chat.js.map
