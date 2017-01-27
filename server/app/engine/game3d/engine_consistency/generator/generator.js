/**
 * Create and fill chunks.
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _worldgenerator = require('./worldgenerator');

var _worldgenerator2 = _interopRequireDefault(_worldgenerator);

var _builder_chunks = require('../builder/builder_chunks');

var _builder_chunks2 = _interopRequireDefault(_builder_chunks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Generator = function () {
    function Generator(consistencyEngine) {
        (0, _classCallCheck3.default)(this, Generator);

        this._worldModel = consistencyEngine.worldModel;
    }

    (0, _createClass3.default)(Generator, [{
        key: 'generateWorld',
        value: function generateWorld() {
            // TODO [MEDIUM] generate distinct worlds.
            var world = this._worldModel.getWorld();

            // TODO [LOW] chrono and time out.
            return new _promise2.default(function (resolve) {

                // Generate blocks.
                var x = world.xSize,
                    y = world.ySize,
                    z = world.zSize;
                var chunkMap = _worldgenerator2.default.generateFlatWorld(x, y, z, world);

                // Affect chunks.
                world.allChunks = chunkMap;

                // Finalize chunks (extract surface faces).
                var chunks = new _map2.default(chunkMap); // Shallow copy.
                // Adds chunks in worldModel, so mutable chunkMapCollection does not fit.
                chunks.forEach(function (chunk, id) {
                    return _builder_chunks2.default.computeChunkFaces(chunk);
                });

                // Notify
                resolve();
            });
        }
    }]);
    return Generator;
}();

exports.default = Generator;
//# sourceMappingURL=generator.js.map
