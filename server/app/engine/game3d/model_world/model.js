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

var _world = require('./world');

var _world2 = _interopRequireDefault(_world);

var _collections = require('../../math/collections');

var _collections2 = _interopRequireDefault(_collections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WorldModel = function () {
    function WorldModel(game) {
        (0, _classCallCheck3.default)(this, WorldModel);

        this._game = game;

        this._worlds = new _map2.default();

        this._worlds.set(-1, new _world2.default(-1, this));
    }

    (0, _createClass3.default)(WorldModel, [{
        key: 'addWorld',
        value: function addWorld(worldId) {
            var wid = worldId || _collections2.default.generateId(this._worlds);

            if (this._worlds.has(wid)) return;
            var w = new _world2.default(wid, this);
            this._worlds.set(wid, w);

            return w;
        }
    }, {
        key: 'getWorld',
        value: function getWorld(worldId) {
            if (!worldId) worldId = -1;
            return this._worlds.get(worldId);
        }
    }]);
    return WorldModel;
}();

WorldModel.serverLoadingRadius = 5;
exports.default = WorldModel;
//# sourceMappingURL=model.js.map
