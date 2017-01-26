/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var XBuffer = function () {
    function XBuffer() {
        (0, _classCallCheck3.default)(this, XBuffer);

        // Don't implement add/removeX
        // For they'll be updated next frame.
        // Should do same with players :/

        this._outputBuffer = new _map2.default();
    }

    (0, _createClass3.default)(XBuffer, [{
        key: 'updateXForPlayer',
        value: function updateXForPlayer(playerId, addedX, removedX) {
            if (!addedX && !removedX) return;

            if (addedX && removedX) (0, _assign2.default)(addedX, removedX);else if (removedX) addedX = removedX;

            this._outputBuffer.set(playerId, addedX);
        }
    }, {
        key: 'getOutput',
        value: function getOutput() {
            return new _map2.default(this._outputBuffer);
        }
    }, {
        key: 'flush',
        value: function flush() {
            this._outputBuffer = new _map2.default();
        }
    }]);
    return XBuffer;
}();

exports.default = XBuffer;
//# sourceMappingURL=buffer_x.js.map
