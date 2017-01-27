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

var _chunk = require('./../../model_world/chunk');

var _chunk2 = _interopRequireDefault(_chunk);

var _generator_test = require('./generator_test.js');

var _generator_test2 = _interopRequireDefault(_generator_test);

var _generator_analytic = require('./generator_analytic.js');

var _generator_analytic2 = _interopRequireDefault(_generator_analytic);

var _generator_simple = require('./generator_simple.js');

var _generator_simple2 = _interopRequireDefault(_generator_simple);

var _generator_perlin = require('./generator_perlin.js');

var _generator_perlin2 = _interopRequireDefault(_generator_perlin);

var _generator_simple_perlin = require('./generator_simple_perlin.js');

var _generator_simple_perlin2 = _interopRequireDefault(_generator_simple_perlin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ChunkGenerator = function () {
    function ChunkGenerator() {
        (0, _classCallCheck3.default)(this, ChunkGenerator);
    }

    (0, _createClass3.default)(ChunkGenerator, null, [{
        key: 'createRawChunk',


        /**
         * N.B. the created chunks are in memory but not ready yet.
         * To finalize creation, add them into the manager model.
         * Then, call Extractor.computeFaces(chunk).
         */
        value: function createRawChunk(x, y, z, id, world) {
            console.log('createRawChunk ' + id);
            var c = new _chunk2.default(x, y, z, id, world);

            //GenTest.testChunk(c);
            //GenTest.testMerge(c);
            //GenSimple.fillChunk(c, 40, 1);
            //GenAnalytic.waveChunk(c, 40, 48, 1);
            try {
                // GenPerlin.perlinGeneration(c);
                _generator_simple_perlin2.default.simplePerlinGeneration(c, false, world.worldId);
            } catch (e) {
                console.log(e.stack);
            }

            return c;
        }
    }, {
        key: 'createChunk',
        value: function createChunk(x, y, z, id, world) {

            var c = new _chunk2.default(x, y, z, id, world);

            // let generationMethod = world.generationMethod;
            // switch (generationMethod) {
            // GenSimple.fillChunk(c, 41, 1);
            // GenAnalytic.waveChunk(c, 10, 15, 1);
            // GenSimple.fillChunk(c, 256, 0);
            // GenPerlin.perlinGeneration(c);
            _generator_simple_perlin2.default.simplePerlinGeneration(c, false, world.worldId); // params: chunk, doShuffleChunks

            return c;
        }
    }]);
    return ChunkGenerator;
}();

ChunkGenerator.debug = false;
exports.default = ChunkGenerator;
//# sourceMappingURL=chunkgenerator.js.map
