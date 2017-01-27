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

var Simple = function () {
    function Simple() {
        (0, _classCallCheck3.default)(this, Simple);
    }

    (0, _createClass3.default)(Simple, null, [{
        key: 'fillChunk',


        // Set all cubes until a given height to a given id.
        value: function fillChunk(chunk, toZ, blockId) {
            if (typeof toZ !== "number") return;
            if (typeof blockId !== "number") return;
            if (_chunkgenerator2.default.debug) console.log('Generating chunk ' + chunk.chunkId + ' to ' + toZ + '...');

            var numberOfBlocksToFill = chunk.dimensions[0] * chunk.dimensions[1] * toZ;
            var numberOfBlocks = chunk.capacity;

            var blocks = new Uint8Array(numberOfBlocks);
            blocks.fill(blockId, 0, numberOfBlocksToFill);
            blocks.fill(0, numberOfBlocksToFill, numberOfBlocks);

            //blocks[3122] = 1;
            //blocks[3186] = 1;

            /*
             let numberAdded = 0;
             for (let i = numberOfBlocksToFill; i<numberOfBlocksToFill+this._xSize*this._ySize; ++i) {
             if (Math.random() > 0.5) {
             blocks[i] = blockId;
             numberAdded++;
             }
             }
             console.log(numberAdded + " different block(s) added.");
             */

            chunk.blocks = blocks;

            if (_chunkgenerator2.default.debug) console.log("\t" + chunk.blocks.length + " blocks generated.");
        }
    }]);
    return Simple;
}();

exports.default = Simple;
//# sourceMappingURL=generator_simple.js.map
