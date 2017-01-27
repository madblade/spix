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

var GeometryUtils = function () {
    function GeometryUtils() {
        (0, _classCallCheck3.default)(this, GeometryUtils);
    }

    (0, _createClass3.default)(GeometryUtils, null, [{
        key: 'infiniteNormDistance',


        /** Common topology distances **/

        value: function infiniteNormDistance(pos1, pos2) {
            var d = 0;
            for (var i = 0; i < 3; ++i) {
                d = Math.max(d, Math.abs(parseInt(pos1[i]) - parseInt(pos2[i])));
            }return d;
        }
    }, {
        key: 'chunkSquaredEuclideanDistance',
        value: function chunkSquaredEuclideanDistance(pos1, pos2) {
            var result = 0,
                d = void 0;
            for (var i = 0; i < 3; ++i) {
                d = pos1[i] - pos2[i];result += d * d;
            }
            return result;
        }
    }, {
        key: 'entitySquaredEuclideanDistance',
        value: function entitySquaredEuclideanDistance(entityX, entityY) {
            // Two entities on different worlds are considered infinitely far.
            if (entityX.worldId !== entityY.worldId) return Number.POSITIVE_INFINITY;

            // Else return regular Euclidean distance.
            var result = 0;var d = void 0;
            var pX = entityX.position,
                pY = entityY.position;
            for (var i = 0; i < 3; ++i) {
                d = pX[i] - pY[i];result += d * d;
            }
            return result;
        }
    }, {
        key: 'euclideanDistance3',
        value: function euclideanDistance3(v1, v2) {
            var x = v1[0] - v2[0];x *= x;
            var y = v1[1] - v2[1];y *= y;
            var z = v1[2] - v2[2];z *= z;
            return Math.sqrt(x + y + z);
        }
    }]);
    return GeometryUtils;
}();

exports.default = GeometryUtils;
//# sourceMappingURL=geometry.js.map
