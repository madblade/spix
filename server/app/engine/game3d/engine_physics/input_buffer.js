/**
 * Manage entity inputs.
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var InputBuffer = function () {
    function InputBuffer() {
        (0, _classCallCheck3.default)(this, InputBuffer);

        this._buffer = new _map2.default();
    }

    (0, _createClass3.default)(InputBuffer, [{
        key: 'addInput',
        value: function addInput(meta, avatar) {
            var array = this._buffer.get(avatar);
            if (!array) this._buffer.set(avatar, [meta]);else array.push(meta);
        }
    }, {
        key: 'getInput',
        value: function getInput() {
            return this._buffer;
        }
    }, {
        key: 'flush',
        value: function flush() {
            this._buffer = new _map2.default();
        }
    }]);
    return InputBuffer;
}();

exports.default = InputBuffer;
//# sourceMappingURL=input_buffer.js.map
