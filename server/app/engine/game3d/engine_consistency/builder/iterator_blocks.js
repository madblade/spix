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

var BlockIterator = function () {
    function BlockIterator(chunk) {
        (0, _classCallCheck3.default)(this, BlockIterator);

        this._dimensions = chunk.dimensions;
        this._currentFace = null;
    }

    (0, _createClass3.default)(BlockIterator, [{
        key: 'nextFace',
        value: function nextFace() {}
    }, {
        key: 'breadthFirstSearch',
        value: function breadthFirstSearch() {
            var queue = [];
            var startingFace = this._currentFace;
            var marks = {};
            queue.shift();

            /*
            while (!stack.isEmpty()) {
                currentDart = stack.pop();
                betas = currentDart.getBetas();
                for (Dart betaI : betas) {
                    if (betaI == null || betaI.isMarked()) continue;
                    betaI.mark();
                    stack.push(betaI);
                }
            }
            */
        }
    }, {
        key: 'currentFace',
        set: function set(newCurrentFace) {
            this._currentFace = newCurrentFace;
        }
    }]);
    return BlockIterator;
}();

exports.default = BlockIterator;
//# sourceMappingURL=iterator_blocks.js.map
