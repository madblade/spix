/**
 * Manage input transactions.
 * Specialized for world model.
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

var InputBuffer = function () {
    function InputBuffer() {
        (0, _classCallCheck3.default)(this, InputBuffer);

        this._buffer = [];
    }

    (0, _createClass3.default)(InputBuffer, [{
        key: 'addInput',
        value: function addInput(avatar, meta) {
            this._buffer.push([avatar, meta]);
        }
    }, {
        key: 'getInput',
        value: function getInput() {
            return this._buffer;
        }
    }, {
        key: 'flush',
        value: function flush() {
            this._buffer = [];
        }
    }]);
    return InputBuffer;
}();

exports.default = InputBuffer;
//# sourceMappingURL=input_buffer.js.map
