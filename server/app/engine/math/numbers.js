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

var NumberUtils = function () {
    function NumberUtils() {
        (0, _classCallCheck3.default)(this, NumberUtils);
    }

    (0, _createClass3.default)(NumberUtils, null, [{
        key: 'isEpsilon',
        value: function isEpsilon(strictlyPositiveNumber) {
            return strictlyPositiveNumber < 0.000001;
        }
    }]);
    return NumberUtils;
}();

exports.default = NumberUtils;
//# sourceMappingURL=numbers.js.map
