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

var _surface_faces_builder = require('./surface_faces_builder');

var _surface_faces_builder2 = _interopRequireDefault(_surface_faces_builder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FaceLinker = function () {
    function FaceLinker() {
        (0, _classCallCheck3.default)(this, FaceLinker);
    }

    (0, _createClass3.default)(FaceLinker, null, [{
        key: 'flatToCoords',
        value: function flatToCoords(flatId, iS, ijS) {
            var i = flatId % iS;
            var j = (flatId - i) % ijS / iS;
            var k = (flatId - flatId % ijS) / ijS;
            return i + ',' + j + ',' + k;
        }
    }, {
        key: 'findN',
        value: function findN(ci, cj, ck, ci$, cj$, ck$) {
            var deltaI = 1 + ci$ - ci;
            var deltaJ = 1 + cj$ - cj;
            var deltaK = 1 + ck$ - ck;

            var dd = deltaI + 3 * deltaJ + 9 * deltaK;

            switch (dd) {
                //case 0: 	break;
                case 1:
                    return 17;
                //case 2: 	break;
                case 3:
                    return 12;
                case 4:
                    return 5;
                case 5:
                    return 10;
                //case 6: 	break;
                case 7:
                    return 16;
                //case 8: 	break;
                case 9:
                    return 9;
                case 10:
                    return 3;
                case 11:
                    return 8;
                case 12:
                    return 1;
                //case 13: 	break;
                case 14:
                    return 0;
                case 15:
                    return 7;
                case 16:
                    return 2;
                case 17:
                    return 6;
                //case 18: 	break;
                case 19:
                    return 15;
                case 20:
                    return 4;
                case 21:
                    return 13;
                //case 22: 	break;
                case 23:
                    return 11;
                //case 24: 	break;
                case 25:
                    return 14;
                //case 26: 	break;
            }
        }

        // call linkCriterion(flatId, otherFlatId,
        //                      -1 0 1, -1 0 1, -1 0 1,
        //                      chunkI, chunkJ, chunkK capacity, blocks, neighbourBlocks)

    }, {
        key: 'linkCriterion',
        value: function linkCriterion(indexS, indexD, deltaI, deltaJ, deltaK, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks) {
            var dimI = iS;
            var dimJ = ijS / iS;
            var dimK = capacity / ijS;

            // Extract
            var i = indexS % iS;
            var j = (indexS - i) % ijS / iS;
            var k = (indexS - indexS % ijS) / ijS;

            // Detect and shift
            var i$ = i;
            var j$ = j;
            var k$ = k;
            var ci$ = ci;
            var cj$ = cj;
            var ck$ = ck;

            if (deltaI > 0) {
                if (indexD % iS === 0) {
                    // T1
                    ci$ = ci + 1;
                    i$ = 0;
                } else i$ = i + 1;
            } else if (deltaI < 0) {
                if (indexD % iS === iS - 1) {
                    // T4
                    ci$ = ci - 1;
                    i$ = dimI - 1;
                } else i$ = i - 1;
            }

            if (deltaJ > 0) {
                if ((indexD - i$) % ijS === 0) {
                    // T2
                    cj$ = cj + 1;
                    j$ = 0;
                } else j$ = j + 1;
            } else if (deltaJ < 0) {
                if ((indexD - i$) % ijS === ijS - 1) {
                    // T5
                    cj$ = cj - 1;
                    j$ = dimJ - 1;
                } else j$ = j - 1;
            }

            if (deltaK > 0) {
                if (indexD >= capacity) {
                    // T3
                    ck$ = ck + 1;
                    k$ = 0;
                } else k$ = k + 1;
            } else if (deltaK < 0) {
                // should never be covered
                if (indexD < 0) {
                    // T6
                    ck$ = ck - 1;
                    k$ = dimK - 1;
                } else k$ = k - 1;
            }

            // Compute
            var ijk$ = i$ + j$ * iS + k$ * ijS;

            // Locate
            var bs = void 0;
            if (ci === ci$ && cj === cj$ && ck === ck$) {
                bs = blocks[ijk$];
            } else {
                var n = FaceLinker.findN(ci, cj, ck, ci$, cj$, ck$);
                bs = neighbourBlocks[n][ijk$];
                // console.log(indexS + "|" + indexD + " : " +i$+ "," +j$+ "," +k$+ "  " + ijk$ + " | " + n + " | " + bs);
            }

            // Criterion
            return bs === 0;
        }
    }, {
        key: 'affect',
        value: function affect(components, id1, id2) {
            if (components[id1] === 0) console.log("Error @affect after link: (id1) " + id1 + " has 0 component id.");
            if (components[id2] === 0) console.log("Error @affect after link: (id2) " + id2 + " has 0 component id.");

            if (components[id1] < components[id2]) {
                components[id2] = components[id1];
            } else {
                components[id1] = components[id2];
            }
        }

        // TODO [MEDIUM] Z cases verification.
        // TODO [HIGH] manage topology.
        // TODO [HIGH] manage topology client-side.
        /**
         * Neighbours: 0 x+, 1 x-, 2 y+, 3 y-, 4 z+, 5 z-
         */

    }, {
        key: 'linkI',
        value: function linkI(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck) {

            // Lazy termination (prevent id calculations).
            var val = faces[0][flatFaceId];
            if (!val) {
                console.log("WARN. i-* linker was given a faceId which is not present in faces array.");
                return;
            }

            var normalP = val > 0;
            var normalM = val < 0;

            // Working with flat indices (3 arrays of length 'capacity')
            // Working with stacked indices (1 array with [0,capacity[=i, [capacity,2capacity[=j, ...)
            var stackFaceId = flatFaceId;

            // CASE 1: aligned with top and back i (both normals)
            var top = flatFaceId + ijS;
            var ftop = faces[0][top];
            if (top < capacity) {
                if (normalP && ftop > 0 || normalM && ftop < 0) {
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + " i linked to top i " + top);
                    if (ec[top] !== cc[top] && cc[top] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('i, current k: ' + cc[top] + ', ' + cc[stackFaceId]);
                        merger.push([cc[top], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, top, stackFaceId);
                }
            }

            var back = flatFaceId + iS;
            var fback = faces[0][back];
            if (back % ijS === flatFaceId % ijS + iS) {
                if (normalP && fback > 0 || normalM && fback < 0) {
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + " i linked to back i " + back);
                    if (ec[back] !== cc[back] && cc[back] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('i, current k: ' + cc[back] + ', ' + cc[stackFaceId]);
                        merger.push([cc[back], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, back, stackFaceId);
                }
            }

            // CASE 2: orthogonal with CURRENT top and back (j, k)
            var flatTopOrtho = flatFaceId; // k, obviously inbounds POTENTIALLY MERGED
            var ftopo = faces[2][flatTopOrtho];
            if (normalP && ftopo > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + 1 + ijS, 1, 0, 1, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks) || normalM && ftopo < 0) {
                var stackTopOrtho = 2 * capacity + flatFaceId;
                if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' i linked to current k ' + stackTopOrtho);
                if (ec[stackTopOrtho] !== cc[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId]) {
                    if (_surface_faces_builder2.default.debugPostMerger) console.log('i, current k: ' + cc[stackTopOrtho] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackTopOrtho, stackFaceId);
            }

            var flatBackOrtho = flatFaceId; // j, obviously inbounds POTENTIALLY MERGED
            var fbacko = faces[1][flatBackOrtho];
            if (normalP && fbacko > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + 1 + iS, 1, 1, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks) || normalM && fbacko < 0) {
                var stackBackOrtho = capacity + flatFaceId;
                if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' i linked to current j ' + stackBackOrtho);
                if (ec[stackBackOrtho] !== cc[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId]) {
                    if (_surface_faces_builder2.default.debugPostMerger) console.log('i, current j: ' + cc[stackBackOrtho] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrtho, stackFaceId);
            }

            // CASE 3: orthogonal with next top and back (j, k)
            // !!! REVERSE NORMALS !!!
            var flatTopOrthoNext = flatTopOrtho + 1; // k
            if (flatTopOrthoNext % iS === flatTopOrtho % iS + 1) {
                var ftopon = faces[2][flatTopOrthoNext];
                if (normalP && ftopon < 0 || normalM && ftopon > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + ijS, 0, 0, 1, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackTopOrthoNext = 2 * capacity + flatTopOrthoNext;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' i linked to next k ' + stackTopOrthoNext);
                    FaceLinker.affect(cc, stackTopOrthoNext, stackFaceId);
                }
            }

            var flatBackOrthoNext = flatBackOrtho + 1; // j, POTENTIALLY MERGED
            if (flatBackOrthoNext % iS === flatBackOrtho % iS + 1) {
                var fbackon = faces[1][flatBackOrthoNext];
                if (normalP && fbackon < 0 || normalM && fbackon > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + iS, 0, 1, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackBackOrthoNext = capacity + flatBackOrthoNext;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' i linked to next j ' + stackBackOrthoNext);
                    if (ec[stackBackOrthoNext] !== cc[stackBackOrthoNext] && cc[stackBackOrthoNext] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('i, previous j: ' + cc[stackBackOrthoNext] + ',' + cc[stackFaceId]);
                        merger.push([cc[stackBackOrthoNext], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackBackOrthoNext, stackFaceId);
                }
            }

            // CASE 4: ortho with previous j on next i, regular orientation
            var flatOrthoIJ = flatBackOrthoNext - iS;
            if (flatOrthoIJ > 0 && flatOrthoIJ % iS === (flatBackOrtho - iS) % iS + 1) {
                var foij = faces[1][flatOrthoIJ];
                if (normalP && foij > 0 || normalM && foij < 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId - iS, 0, -1, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackOrthoIJ = capacity + flatOrthoIJ;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' i linked to previous j ' + stackOrthoIJ);
                    if (ec[stackOrthoIJ] !== cc[stackOrthoIJ] && cc[stackOrthoIJ] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('i, previous j: ' + cc[stackOrthoIJ] + ',' + cc[stackFaceId]);
                        merger.push([cc[stackOrthoIJ], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackOrthoIJ, stackFaceId);
                }
            }
        }
    }, {
        key: 'linkJ',
        value: function linkJ(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck) {

            // Lazy termination (prevent id calculations).
            var val = faces[1][flatFaceId];
            if (!val) {
                console.log("WARN. j-* linker was given a faceId which is not present in faces array.");
                return;
            }

            var normalP = val > 0;
            var normalM = val < 0;

            var stackFaceId = capacity + flatFaceId;

            // CASE 1: aligned with top and right j
            var top = flatFaceId + ijS; // NOT MERGED YET
            if (top < capacity) {
                var ftop = faces[1][top];
                if (normalP && ftop > 0 || normalM && ftop < 0) {
                    var stackTop = capacity + top;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' j linked to top j ' + stackTop);
                    FaceLinker.affect(cc, stackTop, stackFaceId);
                }
            }

            var right = flatFaceId + 1; // POTENTIALLY MERGED
            if (right % iS === flatFaceId % iS + 1) {
                var fright = faces[1][right];
                if (normalP && fright > 0 || normalM && fright < 0) {
                    var stackRight = capacity + right;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' j linked to back j ' + stackRight);
                    if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('j, back j: ' + cc[stackRight] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackRight], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackRight, stackFaceId);
                }
            }

            // CASE 2: orthogonal with top (k)
            var flatTopOrtho = flatFaceId; // k, obviously inbounds, POTENTIALLY MERGED
            var ftopo = faces[2][flatTopOrtho];
            if (normalP && ftopo > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + iS + ijS, 0, 1, 1, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks) || normalM && ftopo < 0) {
                var stackTopOrtho = 2 * capacity + flatFaceId;
                if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' j linked to current k ' + stackTopOrtho);
                if (cc[stackTopOrtho] !== ec[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId]) {
                    if (_surface_faces_builder2.default.debugPostMerger) console.log('j, current k ' + cc[stackTopOrtho] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackTopOrtho, stackFaceId);
            }

            // CASE 3: orthogonal with next k or next i
            // REVERSE ORIENTATION
            var flatTopOrthoNext = flatTopOrtho + iS; // next k, NOT MERGED YET
            if (flatTopOrthoNext % ijS === flatTopOrtho % ijS + iS) {
                var ftopon = faces[2][flatTopOrthoNext];
                if (normalP && ftopon < 0 || normalM && ftopon > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + ijS, 0, 0, 1, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackTopOrthoNext = 2 * capacity + flatTopOrthoNext;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' j linked to next k ' + stackTopOrthoNext);
                    FaceLinker.affect(cc, stackTopOrthoNext, stackFaceId);
                }
            }

            var flatBackOrthoNext = flatFaceId + iS; // next i, POTENTIALLY MERGED
            if (flatBackOrthoNext % ijS === flatFaceId % ijS + iS) {
                var fbackon = faces[0][flatBackOrthoNext];
                if (normalP && fbackon < 0 || normalM && fbackon > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + 1, 1, 0, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackBackOrthoNext = flatFaceId + iS;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' j linked to next i ' + stackBackOrthoNext);
                    if (cc[stackBackOrthoNext] !== ec[stackBackOrthoNext] && cc[stackBackOrthoNext] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('j, current k ' + cc[stackBackOrthoNext] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackBackOrthoNext], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackBackOrthoNext, stackFaceId);
                }
            }
        }
    }, {
        key: 'linkK',
        value: function linkK(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck) {

            // Lazy termination (prevent id calculations).
            var val = faces[2][flatFaceId];
            if (!val) {
                console.log("WARN. k-* linker was given a faceId which is not present in faces array.");
                console.log('\tface id: ' + flatFaceId);
                console.log('\tvalue: ' + val);
                return;
            }

            var normalP = val > 0;
            var normalM = val < 0;

            var stackFaceId = 2 * capacity + flatFaceId;

            // CASE 1: aligned with back and right k
            var right = flatFaceId + 1; // right k
            if (right % iS === flatFaceId % iS + 1) {
                // is it inbounds?
                var fright = faces[2][right];
                if (normalP && fright > 0 || normalM && fright < 0) {
                    var stackRight = 2 * capacity + right;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' k linked to right k ' + stackRight);
                    if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('k, right k: ' + cc[stackRight] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackRight], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackRight, stackFaceId);
                }
            }

            var back = flatFaceId + iS; // back k
            if (back % ijS === flatFaceId % ijS + iS) {
                var fback = faces[2][back];
                if (normalP && fback > 0 || normalM && fback < 0) {
                    var stackBack = 2 * capacity + back;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' k linked to back k ' + stackBack);
                    if (cc[stackBack] !== ec[stackBack] && cc[stackBack] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('k, back k: ' + cc[stackBack] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackBack], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackBack, stackFaceId);
                }
            }

            // CASE 2: orthogonal with (upper current and previous) back and right (j, i)
            // Current -> reverse orientation
            var flatBackOrthoCurrent = flatFaceId + ijS; // j
            if (flatBackOrthoCurrent < capacity) {
                var fbackoc = faces[1][flatBackOrthoCurrent];
                if (normalP && fbackoc < 0 || normalM && fbackoc > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + iS, 0, 1, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackBackOrtho = capacity + flatBackOrthoCurrent;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' k linked to current j ' + stackBackOrtho);
                    if (cc[stackBackOrtho] !== ec[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('k, current j: ' + cc[stackBackOrtho] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackBackOrtho, stackFaceId);
                }
            }

            var flatRightOrthoCurrent = flatFaceId + ijS; // i
            if (flatRightOrthoCurrent < capacity) {
                var frightoc = faces[0][flatRightOrthoCurrent];
                if (normalP && frightoc < 0 || normalM && frightoc > 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId + 1, 1, 0, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackRightOrthoCurrent = flatRightOrthoCurrent;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' k linked to current i ' + stackRightOrthoCurrent);
                    if (cc[stackRightOrthoCurrent] !== ec[stackRightOrthoCurrent] && cc[stackRightOrthoCurrent] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('k, current i: ' + cc[stackRightOrthoCurrent] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackRightOrthoCurrent], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackRightOrthoCurrent, stackFaceId);
                }
            }

            // Previous -> regular orientation
            var flatBackOrthoPrevious = flatBackOrthoCurrent - iS; // j
            if (flatBackOrthoPrevious < capacity && flatBackOrthoPrevious % ijS === flatBackOrthoCurrent % ijS - iS) {
                var fbackop = faces[1][flatBackOrthoPrevious];
                if (normalP && fbackop > 0 || normalM && fbackop < 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId - iS, 0, -1, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackBackOrthoPrevious = capacity + flatBackOrthoPrevious;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' k linked to previous j ' + stackBackOrthoPrevious);
                    if (cc[stackBackOrthoPrevious] !== ec[stackBackOrthoPrevious] && cc[stackBackOrthoPrevious] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('k, previous j: ' + cc[stackBackOrthoPrevious] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackBackOrthoPrevious], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackBackOrthoPrevious, stackFaceId);
                }
            }

            var flatRightOrthoPrevious = flatRightOrthoCurrent - 1; // i
            if (flatRightOrthoPrevious < capacity && flatRightOrthoPrevious % iS === flatRightOrthoCurrent % iS - 1) {
                var frightop = faces[0][flatRightOrthoPrevious];
                if (normalP && frightop > 0 || normalM && frightop < 0 && FaceLinker.linkCriterion(flatFaceId, flatFaceId - 1, -1, 0, 0, ci, cj, ck, iS, ijS, capacity, blocks, neighbourBlocks)) {
                    var stackRightOrthoPrevious = flatRightOrthoPrevious;
                    if (_surface_faces_builder2.default.debugLinks) console.log(stackFaceId + ' k linked to previous i ' + stackRightOrthoPrevious);
                    if (cc[stackRightOrthoPrevious] !== ec[stackRightOrthoPrevious] && cc[stackRightOrthoPrevious] !== cc[stackFaceId]) {
                        if (_surface_faces_builder2.default.debugPostMerger) console.log('k, previous i: ' + cc[stackRightOrthoPrevious] + ', ' + cc[stackFaceId]);
                        merger.push([cc[stackRightOrthoPrevious], cc[stackFaceId]]);
                    }
                    FaceLinker.affect(cc, stackRightOrthoPrevious, stackFaceId);
                }
            }
        }
    }]);
    return FaceLinker;
}();

exports.default = FaceLinker;
//# sourceMappingURL=surface_faces_linker.js.map
