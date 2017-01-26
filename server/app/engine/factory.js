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

var _game = require('./game3d/game');

var _game2 = _interopRequireDefault(_game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GameFactory = function () {
    function GameFactory() {
        (0, _classCallCheck3.default)(this, GameFactory);
    }

    (0, _createClass3.default)(GameFactory, null, [{
        key: 'createGame',
        value: function createGame(hub, kind, gameId, connector) {
            var game;
            switch (kind) {
                case 'game2d':
                    break;
                case 'game3d':
                    game = new _game2.default(hub, gameId, connector);
                    break;
                default:
                    console.log("Unknown game kind requested @ GameFactory");
            }

            return game;
        }
    }]);
    return GameFactory;
}();

exports.default = GameFactory;
//# sourceMappingURL=factory.js.map
