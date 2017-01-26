/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EntityBuffer = function () {
    function EntityBuffer() {
        (0, _classCallCheck3.default)(this, EntityBuffer);

        this._addedPlayers = new _set2.default();
        this._removedPlayers = new _set2.default();
        this._outputBuffer = new _map2.default();
    }

    (0, _createClass3.default)(EntityBuffer, [{
        key: 'spawnPlayer',
        value: function spawnPlayer(player) {
            var removedPlayers = this._removedPlayers;
            var id = player.avatar.id;
            if (removedPlayers.has(id)) removedPlayers.delete(id);else this._addedPlayers.add(id);
        }
    }, {
        key: 'removePlayer',
        value: function removePlayer(playerId) {
            var addedPlayers = this._addedPlayers;
            if (addedPlayers.has(playerId)) addedPlayers.delete(playerId);else this._removedPlayers.add(playerId);
        }

        // addedEntities:   entity id => {p:e.position, r:e.rotation, k:e.kind}
        // removedEntities: entity id => null

    }, {
        key: 'updateEntitiesForPlayer',
        value: function updateEntitiesForPlayer(playerId, addedEntities, removedEntities) {
            // Check.
            if (!addedEntities && !removedEntities) return;
            if (addedEntities && removedEntities) (0, _assign2.default)(addedEntities, removedEntities); // Aggregate.
            else if (removedEntities) addedEntities = removedEntities;

            // Output.
            this._outputBuffer.set(playerId, addedEntities);
        }

        // Shallow.

    }, {
        key: 'getOutput',
        value: function getOutput() {
            return new _map2.default(this._outputBuffer);
        }
    }, {
        key: 'flush',
        value: function flush() {
            this._addedPlayers = new _set2.default();
            this._removedPlayers = new _set2.default();
            this._outputBuffer = new _map2.default();
        }
    }, {
        key: 'addedPlayers',
        get: function get() {
            return this._addedPlayers;
        }
    }, {
        key: 'removedPlayers',
        get: function get() {
            return this._removedPlayers;
        }
    }]);
    return EntityBuffer;
}();

exports.default = EntityBuffer;
//# sourceMappingURL=buffer_entity.js.map
