/**
 * Utility class encapsulating player management.
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

/**
 * Note: every time a user joins a given game, it is given a new Player instance.
 * So all Player instances which belong to a game must be cleaned at the moment this game is cleaned.
 */

var PlayerManager = function () {
    function PlayerManager() {
        (0, _classCallCheck3.default)(this, PlayerManager);

        this._players = [];
        this._handleAddPlayer = null;
        this._handleRemovePlayer = null;
    }

    (0, _createClass3.default)(PlayerManager, [{
        key: 'addPlayer',
        value: function addPlayer(player) {
            this._players.push(player);
            if (this._handleAddPlayer) this._handleAddPlayer(player);
        }
    }, {
        key: 'getPlayerFromId',
        value: function getPlayerFromId(playerId) {
            var players = this._players;
            for (var p = 0, l = players.length; p < l; ++p) {
                var player = players[p];
                if (player.avatar && player.avatar.id === playerId) return player;
            }
            return false;
        }
    }, {
        key: 'removePlayer',
        value: function removePlayer(player) {
            _collections2.default.removeFromArray(this._players, player);
            if (this._handleRemovePlayer) this._handleRemovePlayer(player);
            player.avatar.die();
            delete player.avatar;
            player.destroy(); // Clean references from player
        }
    }, {
        key: 'removeAllPlayers',
        value: function removeAllPlayers() {
            var _this = this;

            if (this._handleRemovePlayer) this._players.forEach(function (p) {
                return _this._handleRemovePlayer(p);
            });
            this._players.forEach(function (p) {
                return p.destroy();
            }); // Clean references from all players
            this._players = [];
        }
    }, {
        key: 'setAddPlayerBehaviour',
        value: function setAddPlayerBehaviour(f) {
            this._handleAddPlayer = f;
        }
    }, {
        key: 'setRemovePlayerBehaviour',
        value: function setRemovePlayerBehaviour(f) {
            this._handleRemovePlayer = f;
        }

        // Iterator on players.

    }, {
        key: 'forEach',
        value: function forEach(callback) {
            return this._players.forEach(function (p) {
                return callback(p);
            });
        }

        // Clean all references.

    }, {
        key: 'destroy',
        value: function destroy() {
            this.removeAllPlayers();
            delete this._players;
            delete this._handleAddPlayer;
            delete this._handleRemovePlayer;
        }
    }, {
        key: 'nbPlayers',
        get: function get() {
            return this._players.length;
        }
    }]);
    return PlayerManager;
}();

exports.default = PlayerManager;
//# sourceMappingURL=player_manager.js.map
