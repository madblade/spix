/**
 * Load and prepare chunks for players.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _geometry = require('../../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EntityLoader = function () {
    function EntityLoader(consistencyEngine) {
        (0, _classCallCheck3.default)(this, EntityLoader);

        this._entityModel = consistencyEngine.entityModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    (0, _createClass3.default)(EntityLoader, [{
        key: 'computeEntitiesInRange',
        value: function computeEntitiesInRange(player) {
            var entityModel = this._entityModel;
            var avatar = player.avatar;
            var aid = avatar.id;
            var entities = {};

            var thresh = avatar.entityRenderDistance;
            thresh *= thresh; // Squared distance.
            var distance = _geometry2.default.entitySquaredEuclideanDistance;

            // TODO [LACKS] optim O(n²) -> O(Cn)
            entityModel.forEach(function (e) {
                var eid = e.id;if (eid !== aid) {
                    if (distance(e, avatar) < thresh) entities[eid] = { p: e.position, r: e.rotation, k: e.kind };
                }
            });

            // TODO [HIGH] worldify: compute entities on loaded chunks.
            // (as it is the only way to detect in-range entities)

            return entities;
        }
    }, {
        key: 'computeNewEntitiesInRange',
        value: function computeNewEntitiesInRange(player, updatedEntities, addedPlayers, removedPlayers) {
            var entityModel = this._entityModel;
            var consistencyModel = this._consistencyModel;
            var avatar = player.avatar;
            var thresh = avatar.entityRenderDistance;
            thresh *= thresh; // Squared distance.

            // TODO [HIGH] also compute entities on loaded chunks.
            var distance = _geometry2.default.entitySquaredEuclideanDistance;

            var addedEntities = {};
            var removedEntities = {};

            // TODO [LACKS]: O(n²) -> O(Cn).
            // TODO [HIGH]: also use for AABB phase in physics.
            var aid = avatar.id;
            entityModel.forEach(function (e) {
                var eid = e.id;if (eid !== aid) {
                    // For all different entities.

                    // Compute distance & find in OLD consistency model.
                    var isInRange = distance(e, avatar) < thresh;

                    // TODO [PERF] n² log² n !!
                    var isPresent = consistencyModel.hasEntity(aid, eid);

                    if (isInRange && !isPresent) addedEntities[eid] = { p: e.position, r: e.rotation, k: e.kind };else if (!isInRange && isPresent) removedEntities[eid] = null;else if (isInRange && updatedEntities.has(eid)) addedEntities[eid] = { p: e.position, r: e.rotation, k: e.kind };
                }
            });

            removedPlayers.forEach(function (eid) {
                if (consistencyModel.hasEntity(aid, eid)) removedEntities[eid] = null;
            });

            return [addedEntities, removedEntities];
        }
    }]);
    return EntityLoader;
}();

exports.default = EntityLoader;
//# sourceMappingURL=loader_entity.js.map
