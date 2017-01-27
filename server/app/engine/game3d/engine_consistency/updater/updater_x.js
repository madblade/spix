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

var XUpdater = function () {
    function XUpdater(consistencyEngine) {
        (0, _classCallCheck3.default)(this, XUpdater);

        this._worldModel = consistencyEngine.worldModel;
        this._xModel = consistencyEngine.xModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    (0, _createClass3.default)(XUpdater, [{
        key: 'update',
        value: function update(avatar, data) {
            var worldModel = this._worldModel;
            var xModel = this._xModel;
            var consistencyModel = this._consistencyModel;

            // let action = data.action; // 'gate'
            var meta = data.meta;

            var originWorld = parseInt(avatar.worldId);
            var portalToLink = meta[4];
            if (portalToLink) portalToLink = parseInt(portalToLink);

            var x = meta[1],
                y = meta[2],
                z = meta[3];

            if (meta[0] === 'add') {
                xModel.addPortal(originWorld, x, y, z, x, y, z + 1, 0.999, 'both', portalToLink);
            } else if (meta[0] === 'del') {
                xModel.removePortalFromPosition(originWorld, x, y, z);
            }
        }
    }]);
    return XUpdater;
}();

exports.default = XUpdater;
//# sourceMappingURL=updater_x.js.map
