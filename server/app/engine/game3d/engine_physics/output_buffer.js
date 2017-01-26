/**
 * Aggregate entity updates.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OutputBuffer = function () {
    function OutputBuffer() {
        (0, _classCallCheck3.default)(this, OutputBuffer);

        // Contains ids of updated entities.
        this._buffer = new _set2.default();
    }

    (0, _createClass3.default)(OutputBuffer, [{
        key: 'entityUpdated',
        value: function entityUpdated(entityId) {
            this._buffer.add(entityId);
        }

        // Shallow.

    }, {
        key: 'getOutput',
        value: function getOutput() {
            return new _set2.default(this._buffer);
        }
    }, {
        key: 'flushOutput',
        value: function flushOutput(modelEntities) {
            this._buffer = new _set2.default();
        }
    }]);
    return OutputBuffer;
}();

exports.default = OutputBuffer;
//# sourceMappingURL=output_buffer.js.map
