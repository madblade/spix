/**
 *
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

var _factory = require('./factory');

var _factory2 = _interopRequireDefault(_factory);

var _collections = require('../../math/collections');

var _collections2 = _interopRequireDefault(_collections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EntityModel = function () {
    function EntityModel(game) {
        (0, _classCallCheck3.default)(this, EntityModel);

        this._game = game;

        // Objects.
        // TODO [MEDIUM] accessor: LACKS.
        this._entities = new _map2.default();
    }

    (0, _createClass3.default)(EntityModel, [{
        key: 'forEach',
        value: function forEach(callback) {
            var entities = this._entities;
            entities.forEach(function (entity, id) {
                callback(entity);
            });
        }
    }, {
        key: 'spawnPlayer',
        value: function spawnPlayer(p) {
            var entities = this._entities;
            var worldModel = this._game.worldModel;
            var id = _collections2.default.generateId(entities);
            p.avatar = _factory2.default.createAvatar(id, this);

            // TODO [MEDIUM] custom spawn world and location.
            var world = worldModel.getWorld();
            p.avatar.spawn(world.getFreePosition(), world.worldId);

            entities.set(id, p.avatar);
        }
    }, {
        key: 'removePlayer',
        value: function removePlayer(playerId) {
            this._entities.delete(playerId);
        }

        // TODO [MEDIUM] optimize with LACKS structure.

    }, {
        key: 'anEntityIsPresentOn',
        value: function anEntityIsPresentOn(x, y, z) {
            var entities = this._entities;
            var result = false;
            entities.forEach(function (entity, id) {
                var p = entity.position;
                if (p[0] >= x && p[0] <= x + 1 && p[1] >= y && p[1] <= y + 1 && p[2] >= z && p[2] <= z + 1) result = true;
            });

            return result;
        }
    }, {
        key: 'entities',
        get: function get() {
            return this._entities;
        }
    }]);
    return EntityModel;
}();

exports.default = EntityModel;
//# sourceMappingURL=model.js.map
