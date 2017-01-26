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

var Analytic = function () {
    function Analytic() {
        (0, _classCallCheck3.default)(this, Analytic);
    }

    (0, _createClass3.default)(Analytic, null, [{
        key: 'waveChunk',
        value: function waveChunk(chunk, minZ, maxZ, blockId) {
            if (minZ >= maxZ || maxZ >= chunk.capacity) console.log("Wave generator: invalid parameters");

            var dx = chunk.dimensions[0];
            var dy = chunk.dimensions[1];
            var deltaK = maxZ - minZ;

            var underneathWave = dx * dy * minZ;
            var overWave = dx * dy * maxZ;
            var numberOfBlocks = chunk.capacity;

            var offsetX = chunk.chunkI * dx;
            var offsetY = chunk.chunkJ * dy;
            var fn = function fn(i, j) {
                var x = (i + offsetX) * 100;
                var y = (j + offsetY) * 100;
                return 0.3 * deltaK * (1.57079632679 + .6 * Math.sin(x - y + 2 * Math.sin(y)) + .3 * Math.sin(x * 2 + y * 2 * 1.81) + .1825 * Math.sin(x * 3 - y * 2 * 2.18));
            };

            var blocks = new Uint8Array(numberOfBlocks);
            if (chunk.chunkK !== 0) {
                blocks.fill(0, 0, numberOfBlocks);
                return;
            }
            blocks.fill(blockId, 0, underneathWave);

            blocks.fill(0, underneathWave, overWave);
            var index = underneathWave;
            for (var k = 0, l = deltaK; k < l; ++k) {
                for (var i = 0; i < dx; ++i) {
                    for (var j = 0; j < dy; ++j) {
                        if (k < fn(i, j)) blocks[index] = blockId;
                        index++;
                    }
                }
            }

            blocks.fill(0, overWave, numberOfBlocks);

            chunk.blocks = blocks;
            if (_chunkgenerator2.default.debug) console.log("\t" + chunk.blocks.length + " blocks generated.");
        }
    }]);
    return Analytic;
}();

exports.default = Analytic;
//# sourceMappingURL=generator_analytic.js.map
