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

var _avatar = require('./avatar');

var _avatar2 = _interopRequireDefault(_avatar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EntityFactory = function () {
    function EntityFactory() {
        (0, _classCallCheck3.default)(this, EntityFactory);
    }

    (0, _createClass3.default)(EntityFactory, null, [{
        key: 'createAvatar',
        value: function createAvatar(id, entityModel) {
            return new _avatar2.default(id, entityModel);
        }
    }]);
    return EntityFactory;
}();

exports.default = EntityFactory;
//# sourceMappingURL=factory.js.map
