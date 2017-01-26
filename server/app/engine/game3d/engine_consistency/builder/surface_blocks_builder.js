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

var _builder_chunks = require('./builder_chunks');

var _builder_chunks2 = _interopRequireDefault(_builder_chunks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CSBX = function () {
    function CSBX() {
        (0, _classCallCheck3.default)(this, CSBX);
    }

    (0, _createClass3.default)(CSBX, null, [{
        key: 'extractSurfaceBlocks',
        value: function extractSurfaceBlocks(chunk) {

            var neighbourChunks = [];
            var neighbourBlocks = [];

            var numberOfNeighbours = 6;

            // Get all neighbour chunks.
            for (var i = 0; i < numberOfNeighbours; ++i) {
                neighbourChunks.push(_builder_chunks2.default.getNeighboringChunk(chunk, i));
                neighbourBlocks.push(neighbourChunks[i].blocks);
            }

            var currentSbs = chunk.surfaceBlocks;
            var blocks = chunk.blocks;
            var nSbs = [];
            for (var _i = 0; _i < numberOfNeighbours; ++_i) {
                nSbs.push({});
            }

            var iSize = chunk.dimensions[0];
            var ijSize = chunk.dimensions[0] * chunk.dimensions[1];
            var capacity = blocks.length;

            var addSurfaceBlock = function addSurfaceBlock(bid, sbs) {
                var ijC = bid % ijSize;
                var z = (bid - ijC) / ijSize;
                if (sbs.hasOwnProperty(z)) sbs[z].push(ijC);else sbs[z] = [ijC];
            };

            // Test neighbourhood.
            for (var b = 0; b < capacity; ++b) {
                if (blocks[b] !== 0) {
                    var iPlus = b + 1;
                    if (iPlus % iSize !== 0) {
                        if (blocks[iPlus] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    } else {
                        // Access other chunk
                        if (neighbourBlocks[0][iPlus - iSize] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    var iMinus = b - 1;
                    if (iMinus % iSize !== iSize - 1) {
                        if (blocks[iMinus] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    } else {
                        // Access other chunk
                        if (neighbourBlocks[1][iMinus + iSize] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    var jPlus = b + iSize;
                    if ((jPlus - b % iSize) % ijSize !== 0) {
                        if (blocks[jPlus] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    } else {
                        // Access other chunk
                        if (neighbourBlocks[2][jPlus - ijSize] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    var jMinus = b - iSize;
                    if ((jMinus - b % iSize) % ijSize !== ijSize - 1) {
                        if (blocks[jMinus] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    } else {
                        // Access other chunk
                        if (neighbourBlocks[3][jMinus + ijSize] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    // TODO [HIGH] z criteria.
                    var kPlus = b + ijSize;
                    if (kPlus < capacity) {
                        if (blocks[kPlus] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    } else {
                        if (neighbourBlocks[4][kPlus - capacity] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    var kMinus = b - ijSize;
                    if (kMinus >= 0) {
                        if (blocks[kMinus] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    } else {
                        if (neighbourBlocks[5][kMinus + capacity] === 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    if (CSBX.debug) console.log(b + ' is not a neighbour.');
                } else {
                    // If the current block is empty, test for neighbour x+/y+/z+
                    var _iPlus = b + 1;
                    if (_iPlus % iSize === 0) {
                        if (neighbourBlocks[0][_iPlus - iSize] !== 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    var _jPlus = b + iSize;
                    if ((_jPlus - b % iSize) % ijSize === 0) {
                        if (neighbourBlocks[2][_jPlus - ijSize] !== 0) {
                            addSurfaceBlock(b, currentSbs);
                            continue;
                        }
                    }

                    // TODO [HIGH] check z criteria.
                    var _kPlus = b + ijSize;
                    if (_kPlus >= capacity) {
                        if (neighbourBlocks[4][_kPlus - capacity] !== 0) {
                            addSurfaceBlock(b, currentSbs);
                            // continue;
                        }
                    }
                }
            }
        }
    }]);
    return CSBX;
}();

CSBX.debug = false;
exports.default = CSBX;
//# sourceMappingURL=surface_blocks_builder.js.map
