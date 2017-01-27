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

var Updater = function () {
    function Updater(physicsEngine) {
        (0, _classCallCheck3.default)(this, Updater);

        // Engine.
        this._physicsEngine = physicsEngine;

        // Models.
        this._entityModel = physicsEngine.entityModel;

        // Output. (rotation causes entities to update)
        this._outputBuffer = physicsEngine.outputBuffer;
    }

    (0, _createClass3.default)(Updater, [{
        key: 'update',
        value: function update(inputBuffer) {
            var _this = this;

            // Process incoming actions.
            inputBuffer.forEach(function (array, avatar) // value, key
            {
                // TODO [LOW] compute means or filter some events.
                array.forEach(function (e) {
                    if (e.action === 'move' && typeof e.meta === "string") _this.move(e.meta, avatar);else if (e.action === 'rotate' && e.meta instanceof Array) _this.rotate(e.meta, avatar);else if (e.action === 'action' && typeof e.meta === "string") _this.action(e.meta, avatar);
                });
            });
        }
    }, {
        key: 'move',
        value: function move(meta, avatar) {
            var hasMoved = true;
            switch (meta) {
                case 'f':
                    avatar.goForward();break;
                case 'r':
                    avatar.goRight();break;
                case 'l':
                    avatar.goLeft();break;
                case 'b':
                    avatar.goBackwards();break;
                case 'u':
                    avatar.goUp();break;
                case 'd':
                    avatar.goDown();break;

                case 'fx':
                    avatar.stopForward();break;
                case 'rx':
                    avatar.stopRight();break;
                case 'lx':
                    avatar.stopLeft();break;
                case 'bx':
                    avatar.stopBackwards();break;
                case 'ux':
                    avatar.stopUp();break;
                case 'dx':
                    avatar.stopDown();break;
                case 'xx':
                    avatar.stop();break;

                default:
                    hasMoved = false;
            }
        }
    }, {
        key: 'rotate',
        value: function rotate(meta, avatar) {
            if (avatar.rotation === null) return;

            var outputBuffer = this._outputBuffer;

            var p = meta[0];
            var y = meta[1];

            if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
                avatar.rotate(p, y);
                outputBuffer.entityUpdated(avatar.id);
            }
        }
    }, {
        key: 'action',
        value: function action(meta, avatar) {
            if (meta === "g") {
                this._physicsEngine.shuffleGravity();
            }
        }
    }]);
    return Updater;
}();

exports.default = Updater;
//# sourceMappingURL=updater.js.map
