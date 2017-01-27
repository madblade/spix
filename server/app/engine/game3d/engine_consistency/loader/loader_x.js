/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _geometry = require('../../../math/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var XLoader = function () {
    function XLoader(consistencyEngine) {
        (0, _classCallCheck3.default)(this, XLoader);

        this._xModel = consistencyEngine.xModel;
        this._worldModel = consistencyEngine.worldModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    (0, _createClass3.default)(XLoader, [{
        key: 'computeNewXInRange',
        value: function computeNewXInRange(player) {
            var _wm$getWorld;

            var a = player.avatar;
            var avatarId = a.id;
            var p = a.position;
            var worldId = a.worldId;
            var portalLoadingRadius = a.portalRenderDistance;

            var wm = this._worldModel;
            var xm = this._xModel;
            var cm = this._consistencyModel;

            var chunk = (_wm$getWorld = wm.getWorld(worldId)).getChunkByCoordinates.apply(_wm$getWorld, (0, _toConsumableArray3.default)(p));
            // Format:
            // Map (portal id -> [other portal id, other portal world])

            // Compute new portals in range.
            var connectivity = xm.getConnectivity(worldId, chunk.chunkId, wm, portalLoadingRadius);
            if (!connectivity) return;
            var addedPortals = {};
            var portals = connectivity[0];
            if (portals) portals.forEach(function (array, portalId) {
                var partial = cm.isPartialX();
                if (cm.hasX(avatarId, portalId) && !partial) return;

                // Manage other end as a whole.
                if (partial) {
                    if (array) {
                        addedPortals[portalId] = [].concat((0, _toConsumableArray3.default)(array)); // Other end id, chunk, xyzp, orientation, world id.
                        cm.unsetPartialX(avatarId, portalId);
                    } // Else, nothing to do still.
                } else {
                        if (array) {
                            addedPortals[portalId] = [].concat((0, _toConsumableArray3.default)(array));
                        } else {
                            // If those other ids have length 0, client will consider the portal blank.
                            addedPortals[portalId] = [0];
                            // Then they are flagged as 'partial' in consistency model.
                            cm.setPartialX(avatarId, portalId);
                        }
                    }
            });

            // Update out of range portals.
            // TODO [OPTIM] when getConnectivity is performed, just remember which levels correspond to which portals...
            var playerXs = cm.getXIdsForEntity(avatarId);
            var removedPortals = {};

            var chunks = connectivity[1];
            if (chunks) {
                (function () {
                    var marks = new _map2.default();
                    chunks.forEach(function (c) {
                        return marks.set(c[0] + ',' + c[1], c[2]);
                    });

                    playerXs.forEach(function (portalId) {
                        var p = xm.getPortal(portalId);
                        var i = p.worldId + ',' + p.chunkId;
                        var d = marks.get(i);
                        if (d === undefined || d === null || d > portalLoadingRadius) removedPortals[portalId] = null;
                    });
                })();
            }

            return [addedPortals, removedPortals];
        }
    }]);
    return XLoader;
}();

exports.default = XLoader;
//# sourceMappingURL=loader_x.js.map
