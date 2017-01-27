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

var UserInput = function () {
    function UserInput(game) {
        (0, _classCallCheck3.default)(this, UserInput);

        this._game = game;

        this._physicsEngine = game.physicsEngine;
        this._topologyEngine = game.topologyEngine;
        this._consistencyEngine = game.consistencyEngine;
        this._chat = game.chat;

        this._listeners = {}; // TODO [HIGH] Map.
        this._playerUpdateBuffer = [];
    }

    // Update change in player connection / disconnection.


    (0, _createClass3.default)(UserInput, [{
        key: 'update',
        value: function update() {
            var _this = this;

            var consistencyEngine = this._consistencyEngine;
            var addedOrRemovedPlayers = this._playerUpdateBuffer;
            // WARN: short-circuits physics engine update.
            addedOrRemovedPlayers.forEach(function (update) {
                var type = update[0];
                var player = update[1];

                // Spawn and then listen.
                if (type === 'connect') {
                    consistencyEngine.spawnPlayer(player);
                    _this.listenPlayer(player);
                }

                // Despawn.
                else if (type === 'disconnect') {
                        // Dispensable to unlisten: a disconnected player has purged its playerConnection.
                        // this.unlistenPlayer(player);
                        consistencyEngine.despawnPlayer(player); // player = playerId
                    }
            });

            // Flush.
            this._playerUpdateBuffer = [];
        }
    }, {
        key: 'addPlayer',
        value: function addPlayer(player) {
            this._playerUpdateBuffer.push(['connect', player]);
        }
    }, {
        key: 'removePlayer',
        value: function removePlayer(playerId) {
            this._playerUpdateBuffer.push(['disconnect', playerId]);
        }
    }, {
        key: 'pushToEngine',
        value: function pushToEngine(kind, avatar, engine) {
            return function (data) {
                engine.addInput({ action: kind, meta: data }, avatar);
            };
        }
    }, {
        key: 'listenPlayer',
        value: function listenPlayer(player) {
            var physicsEngine = this._physicsEngine;
            var topologyEngine = this._topologyEngine;
            var consistencyEngine = this._consistencyEngine;
            var avatar = player.avatar;

            var listener = this._listeners[player] = [this.pushToEngine('move', avatar, physicsEngine), this.pushToEngine('rotate', avatar, physicsEngine), this.pushToEngine('block', avatar, topologyEngine), this.pushToEngine('gate', avatar, consistencyEngine), this.pushToEngine('action', avatar, physicsEngine), this._chat.playerInput(player)];

            var i = 0;
            player.on('m', listener[i++]);
            player.on('r', listener[i++]);
            player.on('b', listener[i++]);
            player.on('x', listener[i++]);
            player.on('a', listener[i++]);
            player.on('chat', listener[i++]);
        }
    }, {
        key: 'unlistenPlayer',
        value: function unlistenPlayer(player) {
            // Do not modify queue.
            // Drop inconsistent players when an update is performed.
            var listener = this._listeners[player];
            if (!listener) {
                console.log('WARN: a player which was not listened to left.');
                return;
            }

            var i = 0;
            player.off('m', listener[i++]);
            player.off('r', listener[i++]);
            player.off('b', listener[i++]);
            player.off('x', listener[i++]);
            player.off('a', listener[i++]);
            player.off('chat', listener[i++]);

            delete this._listeners[player];
        }
    }]);
    return UserInput;
}();

exports.default = UserInput;
//# sourceMappingURL=input.js.map
