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

var ChunkIterator = function () {
    function ChunkIterator() {
        (0, _classCallCheck3.default)(this, ChunkIterator);
    }

    (0, _createClass3.default)(ChunkIterator, null, [{
        key: 'BFS',


        /**
         *
         * @param world
         * @param starterChunk
         * @param callback
         *      Callback must return FALSE for early termination
         * @param callbackAdditionalParameters
         * @constructor
         */
        value: function BFS(world, starterChunk, callback, callbackAdditionalParameters) {
            var queue = [];
            var markers = [];

            queue.push(starterChunk);
            while (!queue.empty()) {

                var current = queue.pop();
                markers.push(current);

                // Make your dreams come true
                var status = callback(current, world, callbackAdditionalParameters);

                // Hard-cut when a chunk is to be loaded (client)
                // WARN! Don't cut server side!!!
                if (!status) {
                    return;
                }

                var neighbours = ChunkIterator.get2DNeighbours(current, world);
                for (var i = 0, l = neighbours.length; i < l; ++i) {

                    var neighbour = neighbours[i];
                    if (markers.indexOf(neighbour) < 0) {

                        markers.push(neighbour);
                        queue.push(neighbour);
                    }
                }
            }
        }
    }, {
        key: 'get2DNeighbours',
        value: function get2DNeighbours(currentChunk, world) {
            var i = currentChunk.chunkI;
            var j = currentChunk.chunkJ;
            var k = currentChunk.chunkK;
            var chunks = world.allChunks;

            var neighboursIndices = [i + 1 + ',' + j + ',' + k, i + 1 + ',' + (j + 1) + ',' + k, i + ',' + (j + 1) + ',' + k, i - 1 + ',' + (j + 1) + ',' + k, i - 1 + ',' + j + ',' + k, i - 1 + ',' + (j - 1) + ',' + k, i + ',' + (j - 1) + ',' + k];

            var neighbours = [];

            for (var id = 0, length = neighboursIndices.length; id < length; ++id) {
                var chunkId = neighboursIndices[id];
                var chunk = chunks.get(chunkId);
                if (!chunk) console.log('Iterator: chunk ' + chunkId + ' undefined.');else neighbours.push(chunk);
            }

            /*
                 i 	j	k <- starter
                i+1	j	k
                i+1	j+1	k
                i	j+1	k
                i-1	j+1	k
                i-1	j	k
                i-1	j-1	k
                i	j-1	k
             */

            return neighbours;
        }
    }, {
        key: 'get3DNeighbours',
        value: function get3DNeighbours(currentChunk) {
            var neighbours = [];

            /*
                i	j	k <- starter
                i 	j	k+1
                i+1	j	k+1
                i+1	j+1	k+1
                i	j+1	k+1
                i-1	j+1	k+1
                i-1	j	k+1
                i-1	j-1	k+1
                i	j-1	k+1
                // Next layer, reverse order
                i	j-1	k
                i-1	j-1	k
                i-1	j	k
                i-1	j+1	k
                i	j+1	k
                i+1	j+1	k
                i+1	j	k
                // Last layer, reverse order again >_<
                i+1	j	k-1
                i+1	j+1	k-1
                i	j+1	k-1
                i-1	j+1	k-1
                i-1	j	k-1
                i-1	j-1	k-1
                i	j-1	k-1
                i 	j	k-1
            */
        }
    }]);
    return ChunkIterator;
}();

exports.default = ChunkIterator;
//# sourceMappingURL=iterator_chunks.js.map
