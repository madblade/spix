/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _entity = require('./entity');

var _entity2 = _interopRequireDefault(_entity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Avatar = function (_Entity) {
    (0, _inherits3.default)(Avatar, _Entity);

    function Avatar(id, entityModel) {
        (0, _classCallCheck3.default)(this, Avatar);

        //this._entityModel = entityModel;

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Avatar).call(this, id));

        _this._kind = 'player';

        // Counted as a number of chunks.
        _this._chunkRenderDistance = 5;
        _this._chunkUnloadDistance = 5;
        _this._portalRenderDistance = 2;

        // Counted as a number of blocks.
        _this._entityRenderDistance = 2 * 8;

        _this._role = 0;

        _this._nearestChunkId = null;
        return _this;
    }

    // Returns -1: admin, 0: OP, 1: registered, 2: guest.


    (0, _createClass3.default)(Avatar, [{
        key: 'role',
        get: function get() {
            return this._role;
        },

        //get entityModel()                           { return this._entityModel; }

        set: function set(role) {
            this._role = role;
        }
    }, {
        key: 'chunkRenderDistance',
        get: function get() {
            return this._chunkRenderDistance;
        },
        set: function set(renderDistance) {
            this._chunkRenderDistance = renderDistance;
        }
    }, {
        key: 'chunkUnloadDistance',
        get: function get() {
            return this._chunkUnloadDistance;
        },
        set: function set(unloadDistance) {
            this._chunkUnloadDistance = unloadDistance;
        }
    }, {
        key: 'entityRenderDistance',
        get: function get() {
            return this._entityRenderDistance;
        },
        set: function set(renderDistance) {
            this._entityRenderDistance = renderDistance;
        }
    }, {
        key: 'portalRenderDistance',
        get: function get() {
            return this._portalRenderDistance;
        },
        set: function set(renderDistance) {
            this._portalRenderDistance = renderDistance;
        }
    }, {
        key: 'nearestChunkId',
        get: function get() {
            return this._nearestChunkId;
        },
        set: function set(chunkId) {
            this._nearestChunkId = chunkId;
        }
    }]);
    return Avatar;
}(_entity2.default);

exports.default = Avatar;
//# sourceMappingURL=avatar.js.map
