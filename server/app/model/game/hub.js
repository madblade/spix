/**
 * Game management.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _collections = require('../../engine/math/collections');

var _collections2 = _interopRequireDefault(_collections);

var _factory = require('../factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Hub = function () {
    function Hub(app) {
        (0, _classCallCheck3.default)(this, Hub);

        this._app = app;
        this._games = new _map2.default();
    }

    (0, _createClass3.default)(Hub, [{
        key: 'validateRequest',
        value: function validateRequest() {
            // Count games.
            var games = this._games;

            var nbGames = 0;
            games.forEach(function (gamesForKind, kind) {
                nbGames += gamesForKind.size;
            });

            var validation = nbGames < 5;
            console.log(nbGames > 0 ? nbGames : 'No' + ' game' + (nbGames > 1 ? 's are' : ' is') + ' running or idle.');
            if (!validation) console.log('Invalid game creation request.');
            return validation;
        }
    }, {
        key: 'requestNewGame',
        value: function requestNewGame(user, kind) {
            var app = this._app;

            // Verify.
            if (!Hub.validateUser(user)) return false;
            if (!Hub.validateKind(kind)) return false;
            if (!this.validateRequest()) return false;

            // Create game and notify users.
            var id = this.addGame(kind);
            app.connection.db.notifyGameCreation(kind, id);

            return true;
        }
    }, {
        key: 'getGame',
        value: function getGame(kind, gameId) {
            var gamesOfKind = this._games.get(kind);
            if (!gamesOfKind) return;
            return gamesOfKind.get(gameId);
        }

        /**
         * Lists all games with minimal information.
         * @returns {{}} Object: 1 id = 1 game kind; 1 element = 1 array of game ids.
         */

    }, {
        key: 'listGames',
        value: function listGames() {
            var games = {};
            var modelGames = this._games;

            modelGames.forEach(function (gamesForKind, kind) {
                games[kind] = [];
                var g = games[kind];
                gamesForKind.forEach(function (game, gameId) {
                    g.push(gameId);
                });
            });

            return games;
        }

        /**
         * Not param-safe: use 'requestNewGame' to ensure kind validity.
         * @param kind
         * @returns {*}
         */

    }, {
        key: 'addGame',
        value: function addGame(kind) {
            var games = this._games;
            var connection = this._app.connection;

            // Init list of games of this kind
            if (!games.has(kind)) games.set(kind, new _map2.default());
            var gid = _collections2.default.generateId(games.get(kind));

            // Create matching game
            var game = _factory2.default.createGame(this, kind, gid, connection);

            // Add to games.
            if (game) games.get(kind).set(gid, game);

            return game.gameId;
        }
    }, {
        key: 'endGame',
        value: function endGame(game) {
            if (game.isRunning) {
                console.log("WARN! Trying to end a running game. Abort.");
                return;
            }

            var games = this._games;
            var gid = game.gameId;
            var kind = game.kind;

            game.destroy();
            var gamesOfKind = games.get(kind);
            gamesOfKind.delete(gid);
            if (gamesOfKind.size < 1) games.delete(kind);
        }
    }], [{
        key: 'validateUser',
        value: function validateUser(user) {
            // Do validation
            var res = user !== null;
            if (!res) console.log('Invalid user requested new game.');
            return res;
        }
    }, {
        key: 'validateKind',
        value: function validateKind(kind) {
            var res = false;
            switch (kind) {
                case 'game3d':case 'game2d':
                    res = true;
            }
            if (!res) console.log('Invalid game kind requested.');
            return res;
        }
    }]);
    return Hub;
}();

exports.default = Hub;
//# sourceMappingURL=hub.js.map
