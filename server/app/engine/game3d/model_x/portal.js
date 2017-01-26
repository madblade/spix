/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Portal = function () {

  /**
   * @param worldId origin world.
   * @param id identifier in XModel
   * @param c1 first 3-array position in specified world
   * @param c2 second 3-array block position in specified world
   * @param position (ratio of advancement in the + coordinate direction)
   * @param orientation (looking at '+', '-' or 'both')
   * @param chunk origin chunk (portals are fixed ATM)
   */

  function Portal(worldId, id, c1, c2, position, orientation, chunk) {
    (0, _classCallCheck3.default)(this, Portal);

    this._id = id;
    this._worldId = worldId;
    this._block1 = c1;
    this._block2 = c2;
    this._position = position;
    this._orientation = orientation;
    this._chunk = chunk;
  }

  (0, _createClass3.default)(Portal, [{
    key: 'id',
    get: function get() {
      return this._id;
    }
  }, {
    key: 'worldId',
    get: function get() {
      return this._worldId;
    }
  }, {
    key: 'chunkId',
    get: function get() {
      return this._chunk.chunkId;
    }
  }, {
    key: 'state',
    get: function get() {
      return [].concat((0, _toConsumableArray3.default)(this._block1), (0, _toConsumableArray3.default)(this._block2), [this._position, this._orientation]);
    }
  }, {
    key: 'chunk',
    get: function get() {
      return this._chunk;
    }
  }]);
  return Portal;
}();

exports.default = Portal;
//# sourceMappingURL=portal.js.map
