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

var _portal = require('./portal');

var _portal2 = _interopRequireDefault(_portal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Knot = function () {

    /**
     * @param id knot id in XModel
     * @param portal1 first portal
     * @param portal2 second (if not, generated) portal
     */

    function Knot(id, portal1, portal2) {
        (0, _classCallCheck3.default)(this, Knot);


        this._id = id;
        this._portal1 = portal1;

        if (!portal2) {
            // TODO add random portal.
            // TODO pick random world or create one.
            portal2 = new _portal2.default();
        }

        this._portal2 = portal2;
    }

    (0, _createClass3.default)(Knot, [{
        key: 'otherEnd',
        value: function otherEnd(portal) {
            if (portal === this._portal1) return this._portal2;else if (portal === this._portal2) return this._portal1;else return null;
        }

        // Can a portal link to itself?

    }, {
        key: 'removePortal',
        value: function removePortal(portal) {
            if (portal === this._portal1) this._portal1 = null;else if (portal === this._portal2) this._portal2 = null;
        }
    }, {
        key: 'id',
        get: function get() {
            return this._id;
        }
    }, {
        key: 'portal2',
        get: function get() {
            return this._portal2;
        }
    }, {
        key: 'portal1',
        get: function get() {
            return this._portal1;
        }
    }]);
    return Knot;
}();

exports.default = Knot;
//# sourceMappingURL=knot.js.map
