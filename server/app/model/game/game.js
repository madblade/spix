/**
 * Game (instance) model.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _factory = require('../factory');

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Game = function () {
    function Game(hub, gameId, connector) {
        (0, _classCallCheck3.default)(this, Game);

        // Utility parameters.
        this._hub = hub;
        this._gameId = gameId;
        this._jobId = null;
        this._timeIdleId = null;
        this._connection = connector;

        //
        this._kind = null;
        this._refreshRate = 200;
        this._isRunning = false;
        this._ready = false;

        //
        this._playerManager = _factory2.default.createPlayerManager();
    }

    // Model


    (0, _createClass3.default)(Game, [{
        key: 'broadcast',


        /** Connection **/

        // Send a message to ALL connected users.
        // N.B. encouraged to create custom subchannels within implementations.
        value: function broadcast(kind, data) {
            // TODO [LOW] optimize with dynamic subchans
            this._connection.io.to(this._gameId).emit(kind, data);
        }

        /** Game loop **/

        // Server-render update function (abstract).

    }, {
        key: 'update',
        value: function update() {
            console.log("Abstract loop.");
        }

        // Start game loop.

    }, {
        key: 'start',
        value: function start() {
            var _this = this;

            // Stop waiting for idle threshold.
            clearTimeout(this._timeIdleId);

            // Launch
            this._isRunning = true;
            console.log("Game running.");
            this._jobId = setInterval(function (_) {
                _this.update();
            }, this._refreshRate);
        }

        // Stop game loop.

    }, {
        key: 'pause',
        value: function pause(doTimeout) {
            var _this2 = this;

            console.log("Game stopping.");
            if (this._jobId !== undefined) clearInterval(this._jobId);
            this._isRunning = false;

            // Set idle time limit before despawning this game.
            if (doTimeout) this._timeIdleId = setTimeout(function (_) {
                return _this2.stop();
            }, 30000);
        }

        /** Players **/

    }, {
        key: 'addPlayer',
        value: function addPlayer(player) {
            console.log('A player joined.');

            // Join channel.
            player.join(this.gameId);

            // Add player to model.
            this._playerManager.addPlayer(player);

            // Start game if need be.
            if (this._isRunning) return;
            this._isRunning = true; // Double check
            this.start();
        }
    }, {
        key: 'removePlayer',
        value: function removePlayer(player) {
            console.log('A player left.');

            // Remove from model.
            this._playerManager.removePlayer(player);

            // Stop game if need be.
            if (this._playerManager.nbPlayers > 0 || !this._isRunning) return;
            this.pause(true); // Stop with idle timeout.
        }
    }, {
        key: 'removeAllPlayers',
        value: function removeAllPlayers() {
            this._playerManager.removeAllPlayers();
            if (this._isRunning) this.pause(true); // Stop with idle timeout.
        }

        // Auto-destruction for being idle for too long. Internal use.

    }, {
        key: 'stop',
        value: function stop() {
            console.log("Game " + this._gameId + " ended for being idle for too long.");
            this._hub.endGame(this);
        }

        // To be triggered from Hub only.

    }, {
        key: 'destroy',
        value: function destroy() {
            if (this._isRunning) this.pause(false); // Going to destroy -> no idle timeout.
            this.removeAllPlayers();
            this._playerManager.destroy();
            delete this._hub;
            delete this._timeIdleId;
            delete this._gameId;
            delete this._jobId;
            delete this._connection;
            delete this._kind;
            delete this._refreshRate;
            delete this._isRunning;
        }
    }, {
        key: 'players',
        get: function get() {
            return this._playerManager;
        }
    }, {
        key: 'connector',
        get: function get() {
            return this._connection;
        }
    }, {
        key: 'ready',
        get: function get() {
            return this._ready;
        },
        set: function set(value) {
            this._ready = value;
        }
    }, {
        key: 'kind',
        get: function get() {
            return this._kind;
        }
    }, {
        key: 'gameId',
        get: function get() {
            return this._gameId;
        }
    }, {
        key: 'isRunning',
        get: function get() {
            return this._isRunning;
        }
    }]);
    return Game;
}();

exports.default = Game;
//# sourceMappingURL=game.js.map
