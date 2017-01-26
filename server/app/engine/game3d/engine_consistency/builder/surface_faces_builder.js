/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _builder_chunks = require('./builder_chunks');

var _builder_chunks2 = _interopRequireDefault(_builder_chunks);

var _surface_faces_linker = require('./surface_faces_linker');

var _surface_faces_linker2 = _interopRequireDefault(_surface_faces_linker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CSFX = function () {
    function CSFX() {
        (0, _classCallCheck3.default)(this, CSFX);
    }

    (0, _createClass3.default)(CSFX, null, [{
        key: 'inbounds',
        value: function inbounds(d, b, iS, ijS, capacity) {
            switch (d) {
                case 0:
                    return (b - 1) % iS === b % iS - 1; // iM
                case 1:
                    return (b - iS) % ijS === b % ijS - iS; // jM
                case 2:
                    return b - ijS >= 0; // kM
                case 3:
                    return (b + 1) % iS !== 0; // iP
                case 4:
                    return (b + iS - b % iS) % ijS !== 0; // jP
                case 5:
                    return b + ijS < capacity; // kP
                default:
                    return false;
            }
        } // Lazy, inefficient in terms of i/o

    }, {
        key: 'empty',
        value: function empty(d, b, bs, iS, ijS) {
            switch (d) {
                case 0:
                    return bs[b - 1] === 0; // iM
                case 1:
                    return bs[b - iS] === 0; // jM
                case 2:
                    return bs[b - ijS] === 0; // kM
                case 3:
                    return bs[b + 1] === 0; // iP
                case 4:
                    return bs[b + iS] === 0; // jP
                case 5:
                    return bs[b + ijS] === 0; // kP
                default:
                    return false;
            }
        }
    }, {
        key: 'setFace',
        value: function setFace(direction, bid, blockNature, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid, dontTranslate) {
            var blockId = bid;
            if (!dontTranslate) {
                // Boundary faces with reverted normals.
                switch (direction) {
                    case 0:
                        blockId -= 1;break;
                    case 1:
                        blockId -= iS;break;
                    case 2:
                        blockId -= ijS;break;
                    default:
                }
            }

            // Set surface face
            var d = direction % 3;
            if (d in surfaceFaces) surfaceFaces[d].push(blockId);else surfaceFaces[d] = [blockId];

            // Set faces
            var factor = direction < 3 ? -1 : 1; // Face normal (-1 => towards minus)
            faces[d][blockId] = factor * blockNature; // Face nature

            // Set connected component
            var faceId = d * capacity + blockId;
            encounteredFaces[faceId] = ccid;
            connectedComponents[faceId] = ccid;
        }
    }, {
        key: 'extractRawFaces',
        value: function extractRawFaces(blocks, neighbourBlocks, surfaceBlocks, faces, surfaceFaces, encounteredFaces, connectedComponents, dims) {
            var ccid = 1;

            var iS = dims[0];
            var jS = dims[1];
            var kS = dims[2];

            var ijS = iS * jS;
            var capacity = ijS * kS;

            var nbX = neighbourBlocks[0]; // On x+ boundary.
            var nbY = neighbourBlocks[2]; // On y+ boundary.
            var nbZ = neighbourBlocks[4]; // On z+ boundary.

            // Extract faces.
            for (var z in surfaceBlocks) {

                var layer = surfaceBlocks[z];
                for (var b = 0, length = layer.length; b < length; ++b) {
                    var offset = z * ijS;
                    var idOnCurrentLayer = layer[b];

                    var blockId = idOnCurrentLayer + offset;
                    var block = blocks[blockId];

                    for (var direction = 0; direction < 6; ++direction) {
                        if (CSFX.inbounds(direction, blockId, iS, ijS, capacity)) {
                            if (block !== 0 && CSFX.empty(direction, blockId, blocks, iS, ijS)) {
                                CSFX.setFace(direction, blockId, block, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid);
                                ccid++;
                            }
                        } else {
                            if (direction >= 3) {
                                // x+, y+, z+
                                if (direction === 3) {
                                    var xblock = nbX[blockId - iS + 1];
                                    if (block !== 0 && xblock === 0) {
                                        // i+
                                        CSFX.setFace(3, blockId, block, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid);
                                        ccid++;
                                    } else if (block === 0 && xblock !== 0 && xblock !== undefined) {
                                        // i+
                                        CSFX.setFace(0, blockId, xblock, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid, true);
                                        ccid++;
                                    }
                                }
                                if (direction === 4) {
                                    // j+
                                    var yblock = nbY[blockId - ijS + iS];
                                    if (block !== 0 && yblock === 0) {
                                        CSFX.setFace(4, blockId, block, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid);
                                        ccid++;
                                    } else if (block === 0 && yblock !== 0 && yblock !== undefined) {
                                        CSFX.setFace(1, blockId, yblock, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid, true);
                                        ccid++;
                                    }
                                }
                                // TODO [HIGH] check z
                                if (direction === 5) {
                                    // k+
                                    var zblock = nbZ[blockId - capacity + ijS];
                                    if (block !== 0 && zblock === 0) {
                                        CSFX.setFace(5, blockId, block, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid);
                                        ccid++;
                                    } else if (block === 0 && zblock !== 0 && zblock !== undefined) {
                                        // TODO [LOW] properly manage loading
                                        CSFX.setFace(2, blockId, zblock, faces, surfaceFaces, encounteredFaces, connectedComponents, capacity, iS, ijS, ccid, true);
                                        ccid++;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (CSFX.debug) {
                console.log("Surface block layers " + (0, _keys2.default)(surfaceBlocks).length + ", surface faces: (" + surfaceFaces[0].length + ',' + surfaceFaces[1].length + ',' + surfaceFaces[2].length + ')');
                //faces
            }
        }
    }, {
        key: 'preMerge',
        value: function preMerge(surfaceFaces, connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, chunk) {

            var ci = chunk.chunkI;
            var cj = chunk.chunkJ;
            var ck = chunk.chunkK;

            var ayes = surfaceFaces['0'];
            var jays = surfaceFaces['1'];
            var kays = surfaceFaces['2'];

            var ayesLength = ayes.length;
            var jaysLength = jays.length;
            var kaysLength = kays.length;

            var ayeCurrent = 0;
            var jayCurrent = 0;
            var kayCurrent = 0;

            ayes.sort(function (a, b) {
                return a - b;
            });
            jays.sort(function (a, b) {
                return a - b;
            });
            kays.sort(function (a, b) {
                return a - b;
            });

            if (CSFX.debugIJKRecursion) {
                console.log(ayesLength + " is");
                console.log(jaysLength + " js");
                console.log(kaysLength + " ks");
            }
            //console.log(kays);

            var currentBlock = capacity;
            if (ayesLength > 0) currentBlock = ayes[ayeCurrent];
            if (jaysLength > 0) currentBlock = Math.min(currentBlock, jays[jayCurrent]);
            if (kaysLength > 0) currentBlock = Math.min(currentBlock, kays[kayCurrent]);

            while ((ayeCurrent < ayesLength || jayCurrent < jaysLength || kayCurrent < kaysLength) && currentBlock < capacity) {

                if (ayes[ayeCurrent] === currentBlock) {
                    if (CSFX.debugIJKRecursion) console.log('i ' + ayeCurrent + ' ' + ayes[ayeCurrent]);
                    _surface_faces_linker2.default.linkI(ayes[ayeCurrent], connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck);
                    ayeCurrent++;
                }

                if (jays[jayCurrent] === currentBlock) {
                    if (CSFX.debugIJKRecursion) console.log('j ' + jayCurrent + ' ' + jays[jayCurrent]);
                    _surface_faces_linker2.default.linkJ(jays[jayCurrent], connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck);
                    jayCurrent++;
                }

                if (kays[kayCurrent] === currentBlock) {
                    if (CSFX.debugIJKRecursion) console.log('k ' + kayCurrent + ' ' + kays[kayCurrent]);
                    _surface_faces_linker2.default.linkK(kays[kayCurrent], connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck);
                    kayCurrent++;
                }

                ++currentBlock;
            }

            if (kayCurrent !== kaysLength) console.log("WARN. kays not recursed: " + kayCurrent + " out of " + kaysLength);
            if (jayCurrent !== jaysLength) console.log("WARN. jays not recursed: " + jayCurrent + " out of " + jaysLength);
            if (ayeCurrent !== ayesLength) console.log("WARN. ayes not recursed: " + ayeCurrent + " out of " + ayesLength);

            if (CSFX.debug) console.log('PreMerge successufl! PreMerger state:');
            if (CSFX.debug) console.log(merger);
        }
    }, {
        key: 'precomputeFastConnectedComponents',
        value: function precomputeFastConnectedComponents(connectedComponents, fastCC) {
            for (var i = 0, length = connectedComponents.length; i < length; ++i) {
                if (connectedComponents[i] === 0) continue;
                if (!fastCC.hasOwnProperty(connectedComponents[i])) fastCC[connectedComponents[i]] = [i];else fastCC[connectedComponents[i]].push(i);
            }
        }
    }, {
        key: 'postMerge',
        value: function postMerge(merger, fastCC, connectedComponents) {
            function mergeArrays(a, b) {
                var result = a;
                for (var i = 0; i < b.length; ++i) {
                    if (a.indexOf(b[i]) < 0) a.push(b[i]);
                }
                return result;
            }

            var fastMerger = [];
            if (merger.length > 0) fastMerger.push([merger[0][0], merger[0][1]]);
            for (var c = 1; c < merger.length; ++c) {
                var min = Math.min(merger[c][0], merger[c][1]);
                var max = Math.max(merger[c][0], merger[c][1]);

                var minFound = -1;
                var maxFound = -1;
                for (var d = 0; d < fastMerger.length; ++d) {
                    if (fastMerger[d].indexOf(min) >= 0) minFound = d;
                    if (fastMerger[d].indexOf(max) >= 0) maxFound = d;
                    if (minFound !== -1 && maxFound !== -1) break;
                }

                // Merge arrays
                if (minFound >= 0 && maxFound >= 0 && minFound !== maxFound) {
                    fastMerger[minFound] = mergeArrays(fastMerger[minFound], fastMerger[maxFound]);
                    fastMerger.splice(maxFound, 1);
                } else if (minFound >= 0 && maxFound < 0) {
                    if (fastMerger[minFound].indexOf(max) < 0) fastMerger[minFound].push(max);
                } else if (maxFound >= 0 && minFound < 0) {
                    if (fastMerger[maxFound].indexOf(min) < 0) fastMerger[maxFound].push(min);
                } else if (minFound < 0 && maxFound < 0) {
                    fastMerger.push([min, max]);
                }
            }

            if (CSFX.debug) console.log('PostMerger initialized... PostMerger state:');
            if (CSFX.debug) console.log(fastMerger);

            if (CSFX.debugPostMerger) console.log("Merger:");
            if (CSFX.debugPostMerger) console.log(merger);
            if (CSFX.debugPostMerger) console.log("Fast merger:");
            if (CSFX.debugPostMerger) console.log(fastMerger);
            if (CSFX.debugPostMerger) console.log("Initial components:");
            if (CSFX.debugPostMerger) console.log((0, _keys2.default)(fastCC));

            if (CSFX.forceOneComponentPerChunk) {
                fastMerger = [[]];
                var ks = (0, _keys2.default)(fastCC);
                for (var i = 0; i < ks.length; ++i) {
                    fastMerger[0].push(parseInt(ks[i]));
                }
            }

            for (var k = 0, fmLength = fastMerger.length; k < fmLength; ++k) {
                fastMerger[k].sort(function (a, b) {
                    return a - b;
                });
                var id = fastMerger[k][0];
                if (!fastCC.hasOwnProperty(id)) {
                    console.log('PostMerger failed because of id inconsistency: ' + id);
                    continue;
                }
                var componentsToMerge = fastMerger[k];

                if (CSFX.debug) console.log('Merging ' + componentsToMerge.length + ' component(s) ' + ' to ' + id + ':');
                if (CSFX.debug) console.log(componentsToMerge);

                for (var _i = 1, ctmLength = componentsToMerge.length; _i < ctmLength; ++_i) {
                    var toMerge = componentsToMerge[_i];
                    if (CSFX.debug) console.log('\t' + toMerge);
                    if (!fastCC.hasOwnProperty(toMerge)) {
                        if (CSFX.debugPostMerger) console.log('WARN. ' + 'PostMerger failed during sub-merge because of id inconsistency: ' + toMerge);
                        continue;
                    }
                    var ccToMerge = fastCC[toMerge];
                    // if (CSFX.debug) console.log(ccToMerge);

                    // Merge: update connected components
                    for (var j = 0, cctmLength = ccToMerge.length; j < cctmLength; ++j) {
                        connectedComponents[ccToMerge[j]] = id;
                    } // Merge: update fast components
                    for (var _j = 0, _cctmLength = ccToMerge.length; _j < _cctmLength; ++_j) {
                        fastCC[id].push(ccToMerge[_j]);
                    }delete fastCC[toMerge];
                }
            }

            if (CSFX.debugPostMerger) console.log("Final components:");
            if (CSFX.debugPostMerger) console.log((0, _keys2.default)(fastCC));
        }
    }, {
        key: 'computeFastConnectedComponentIds',
        value: function computeFastConnectedComponentIds(fastCC, fastCCIds, capacity, faces) {
            for (var cccid in fastCC) {
                fastCCIds[cccid] = [];
                var tcur = fastCCIds[cccid];
                var fcc = fastCC[cccid];
                for (var i in fcc) {
                    var j = fcc[i];
                    var orientation = j < capacity ? 0 : j < 2 * capacity ? 1 : 2;
                    var realId = j % capacity;
                    tcur.push(faces[orientation][realId]);
                }
            }
        }
    }, {
        key: 'getNeighbourChunks',
        value: function getNeighbourChunks(neighbourChunks, chunk, neighbourBlocks) {
            //neighbourChunks.push();
            for (var i = 0; i < 17; ++i) {
                neighbourChunks.push(_builder_chunks2.default.getNeighboringChunk(chunk, i));
                neighbourBlocks.push(neighbourChunks[i].blocks);
            }
        }
    }, {
        key: 'extractConnectedComponents',
        value: function extractConnectedComponents(chunk) {
            var neighbourChunks = [];
            var neighbourBlocks = [];

            // Get all six neighbour chunks.
            CSFX.getNeighbourChunks(neighbourChunks, chunk, neighbourBlocks);

            // Properties
            var surfaceBlocks = chunk.surfaceBlocks;
            var blocks = chunk.blocks;

            // Static properties
            var dims = chunk.dimensions;
            var iS = chunk.dimensions[0];
            var ijS = chunk.dimensions[0] * chunk.dimensions[1];
            var capacity = blocks.length;

            // Temporary variables
            var surfaceFaces = { '0': [], '1': [], '2': [] };
            var faces = [new Int32Array(capacity), new Int32Array(capacity), new Int32Array(capacity)];
            var encounteredFaces = new Uint16Array(3 * capacity); // initializes all to 0

            // Results
            var connectedComponents = new Uint16Array(3 * capacity); // ditto
            var fastCC = {};
            var fastCCIds = {};

            // Compute raw faces.
            CSFX.extractRawFaces(blocks, neighbourBlocks, surfaceBlocks, faces, surfaceFaces, encounteredFaces, connectedComponents, dims);

            // Post merger.
            var merger = [];

            // Triple PreMerge.
            CSFX.preMerge(surfaceFaces, connectedComponents, encounteredFaces, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, chunk);

            // Compute fast connected components.
            CSFX.precomputeFastConnectedComponents(connectedComponents, fastCC);
            //console.log(fastCC);

            // PostMerge.
            CSFX.postMerge(merger, fastCC, connectedComponents);
            //console.log(merger);
            //for (let i in connectedComponents) {
            //    if (connectedComponents[i] != 0) console.log('\t' + i + ' | ' + connectedComponents[i]);
            //}

            // Debugging fastCC
            for (var i in fastCC) {
                for (var faceId = 0; faceId < fastCC[i].length; ++faceId) {

                    if (fastCC[i].indexOf(fastCC[i][faceId]) !== faceId) console.log("Detected duplicate face.");

                    var dir = fastCC[i][faceId] < capacity ? 0 : fastCC[i][faceId] < 2 * capacity ? 1 : 2;

                    if (CSFX.debugFastCC) if (faces[dir][fastCC[i][faceId] % capacity] == 0) console.log("Face " + fastCC[i][faceId] + " null: " + faces[dir][fastCC[i][faceId] % capacity]);
                }
            }

            // Induce Ids.
            CSFX.computeFastConnectedComponentIds(fastCC, fastCCIds, capacity, faces);

            // Assign
            chunk.fastComponents = fastCC;
            chunk.fastComponentsIds = fastCCIds;
            chunk.connectedComponents = connectedComponents;

            if (CSFX.debugFastCC) {
                //console.log(fastCC);
                //console.log(fastCCIds);
            }
            if (CSFX.debug) console.log((0, _keys2.default)(fastCC).length + " connected components extracted...");
        }
    }]);
    return CSFX;
}();

CSFX.forceOneComponentPerChunk = true;
CSFX.debug = false;
CSFX.debugIJKRecursion = false;
CSFX.debugLinks = false;
CSFX.debugFastCC = false;
CSFX.debugPostMerger = false;
exports.default = CSFX;
//# sourceMappingURL=surface_faces_builder.js.map
