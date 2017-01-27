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

var _chunkgenerator = require('./chunkgenerator');

var _chunkgenerator2 = _interopRequireDefault(_chunkgenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Test = function () {
    function Test() {
        (0, _classCallCheck3.default)(this, Test);
    }

    (0, _createClass3.default)(Test, null, [{
        key: 'testMerge',
        value: function testMerge(chunk) {
            var dx = chunk.dimensions[0];
            var dy = chunk.dimensions[1];
            var ijS = dx * dy;
            var numberOfBlocks = chunk.capacity;

            var blocks = new Uint8Array(numberOfBlocks);

            blocks.fill(1, 0, ijS * 40);

            for (var k = 0; k < 6; ++k) {
                for (var i = 0; i < 2; ++i) {
                    for (var j = 0; j < 2; ++j) {
                        blocks[ijS * 40 - 10 - i - j * dx - k * dx * dy] = 0;
                    }
                }
            }

            for (var _k = 0; _k < 6; ++_k) {
                for (var _i = 0; _i < 2; ++_i) {
                    for (var _j = 0; _j < 2; ++_j) {
                        blocks[ijS * 40 - 42 - _i - _j * dx - _k * dx * dy] = 0;
                    }
                }
            }

            for (var _k2 = 0; _k2 < 6; ++_k2) {
                for (var _i2 = 0; _i2 < 2; ++_i2) {
                    for (var _j2 = 0; _j2 < 2; ++_j2) {
                        blocks[ijS * 40 - 28 - _i2 - _j2 * dx - _k2 * dx * dy] = 0;
                    }
                }
            }

            chunk.blocks = blocks;
        }
    }, {
        key: 'testChunk',
        value: function testChunk(chunk) {
            var dx = chunk.dimensions[0];
            var dy = chunk.dimensions[1];
            var ijS = dx * dy;
            var numberOfBlocks = chunk.capacity;

            var blocks = new Uint8Array(numberOfBlocks);

            var idx1 = ijS * 48 + dx * 4 + 4;
            blocks[idx1] = 1;
            blocks[idx1 + ijS] = 0;
            blocks[idx1 + 2 * ijS] = 1;

            blocks[idx1 - 1] = 1;
            blocks[idx1 + 1] = 1;

            blocks[idx1 + 1 + ijS] = 1;
            blocks[idx1 + 1 + 2 * ijS] = 1;

            blocks[idx1 - 1 + ijS] = 1;
            blocks[idx1 - 1 + 2 * ijS] = 1;

            blocks[idx1 - 1 + ijS + dx] = 1;
            blocks[idx1 - 1 + ijS - dx] = 1;
            blocks[idx1 - 1 + 2 * ijS + dx] = 1;
            blocks[idx1 - 1 + 2 * ijS - dx] = 1;

            blocks[idx1 + 1 + ijS + dx] = 1;
            blocks[idx1 + 1 + ijS - dx] = 1;
            blocks[idx1 + 1 + 2 * ijS + dx] = 1;
            blocks[idx1 + 1 + 2 * ijS - dx] = 1;

            blocks[idx1 + ijS + dx] = 1;
            blocks[idx1 + ijS - dx] = 1;
            blocks[idx1 + 2 * ijS + dx] = 1;
            blocks[idx1 + 2 * ijS - dx] = 1;

            blocks[idx1 - 1 + dx] = 1;
            blocks[idx1 + 1 + dx] = 1;
            blocks[idx1 - 1 - dx] = 1;
            blocks[idx1 + 1 - dx] = 1;
            blocks[idx1 + dx] = 1;
            blocks[idx1 - dx] = 1;

            chunk.blocks = blocks;
        }
    }]);
    return Test;
}();

exports.default = Test;
//# sourceMappingURL=generator_test.js.map
