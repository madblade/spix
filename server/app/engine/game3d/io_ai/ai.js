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

var AI = function () {
    function AI(game) {
        (0, _classCallCheck3.default)(this, AI);

        this._entityModel = game.entityModel;
        this._worldModel = game.worldModel;
        this._xModel = game.xModel;
    }

    (0, _createClass3.default)(AI, [{
        key: 'update',
        value: function update() {}
    }]);
    return AI;
}();

exports.default = AI;
//# sourceMappingURL=ai.js.map
