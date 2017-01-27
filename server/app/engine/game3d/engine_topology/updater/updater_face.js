/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _collections = require('../../../math/collections');

var _collections2 = _interopRequireDefault(_collections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UpdaterFace = function () {
    function UpdaterFace() {
        (0, _classCallCheck3.default)(this, UpdaterFace);
    }

    (0, _createClass3.default)(UpdaterFace, null, [{
        key: 'detectProbableTopologyChangeAfterAddition',
        value: function detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, faces) {
            // Criterion: at least 2 surface faces that do not link on the inserted cube.
            // i.e. if blocking edges form a cycle.
            // Detects POTENTIAL local topology changes.

            // Compute blocking edges.
            var blockingEdges = [];
            // x-
            if (faces[0] && faces[2] && chunk.contains(x - 1, y - 1, z)) blockingEdges.push([0, 4]);
            if (faces[0] && faces[3] && chunk.contains(x - 1, y + 1, z)) blockingEdges.push([3, 7]);
            if (faces[0] && faces[4] && chunk.contains(x - 1, y, z - 1)) blockingEdges.push([4, 7]);
            if (faces[0] && faces[5] && chunk.contains(x - 1, y, z + 1)) blockingEdges.push([0, 3]);
            // x+
            if (faces[1] && faces[2] && chunk.contains(x + 1, y - 1, z)) blockingEdges.push([1, 5]);
            if (faces[1] && faces[3] && chunk.contains(x + 1, y + 1, z)) blockingEdges.push([2, 6]);
            if (faces[1] && faces[4] && chunk.contains(x + 1, y, z - 1)) blockingEdges.push([5, 6]);
            if (faces[1] && faces[5] && chunk.contains(x + 1, y, z + 1)) blockingEdges.push([1, 2]);
            // y+-z
            if (faces[2] && faces[4] && chunk.contains(x, y - 1, z - 1)) blockingEdges.push([4, 5]);
            if (faces[2] && faces[5] && chunk.contains(x, y - 1, z + 1)) blockingEdges.push([0, 1]);
            if (faces[3] && faces[4] && chunk.contains(x, y + 1, z - 1)) blockingEdges.push([6, 7]);
            if (faces[3] && faces[5] && chunk.contains(x, y + 1, z + 1)) blockingEdges.push([2, 3]);

            // Detect loop.
            var ls = [];
            for (var i = 0; i < blockingEdges.length; ++i) {
                var bi = blockingEdges[i];
                var found = false;

                for (var j = 0; j < ls.length; ++j) {
                    var last = ls[j].length - 1;
                    if (ls[j][last] === bi[0]) {
                        ls[j].push(bi[1]);
                        found = true;
                    }
                    if (ls[j][last] === bi[1]) {
                        ls[j].push(bi[0]);
                        found = true;
                    }
                    if (ls[j][0] === ls[j][last + 1]) {
                        // Loop detected.
                        if (ls[j].length < 4) console.log("invalid detectProbableTopologyChangeAfterAddition algorithm");
                        return true;
                    }
                }

                if (!found) {
                    ls.push([bi[0], bi[1]]);
                }
            }

            // No topology change by default.
            return false;
        }

        // BLOCK ADDITION
        // The difficulty is to determine which surface faces belong to which component after an addition.

    }, {
        key: 'updateSurfaceFacesAfterAddition',
        value: function updateSurfaceFacesAfterAddition(chunk, id, x, y, z) {
            var dimensions = chunk.dimensions;

            // Compute concerned faces.
            var addedFaces = [false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false // z+
            ];

            if (x > 0 && !chunk.contains(x - 1, y, z)) addedFaces[0] = true;
            if (x < dimensions[0] - 1 && !chunk.contains(x + 1, y, z)) addedFaces[1] = true;
            if (y > 0 && !chunk.contains(x, y - 1, z)) addedFaces[2] = true;
            if (y < dimensions[1] - 1 && !chunk.contains(x, y + 1, z)) addedFaces[3] = true;
            if (z > 0 && !chunk.contains(x, y, z - 1)) addedFaces[4] = true;
            if (z < dimensions[2] - 1 && !chunk.contains(x, y, z + 1)) addedFaces[5] = true;

            var removedFaces = [!addedFaces[0] && x > 0, // x-
            !addedFaces[1] && x < dimensions[0] - 1, // x+
            !addedFaces[2] && y > 0, // y-
            !addedFaces[3] && y < dimensions[1] - 1, // y+
            !addedFaces[4] && z > 0, // z-
            !addedFaces[5] && z < dimensions[2] - 1 // z+
            // N.B. whatever the block update, there will always be 6 modified faces (non-boundary case).
            ];

            UpdaterFace.rawUpdateAfterEdition(chunk, id, x, y, z, addedFaces, removedFaces, true);

            if (UpdaterFace.detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, addedFaces))
                // N.B. a necessary yet not sufficient condition for effective division of components within the chunk.
                UpdaterFace.divideConnectedComponents(chunk, id, x, y, z, addedFaces);

            // Topology-preserving boundary faces edition
            return UpdaterFace.updateFacesOnBoundary(chunk, x, y, z, true);
        }

        /**
         * Gets the id of a face taken from a block.
         * @param id block id
         * @param normal which of the 6 faces (+/- x/y/z)
         * 0 -> x-, 1 -> x+, 2 -> y-, 3 -> y+, 4 -> z-, 5 -> z+.
         * @param dimensions chunk size
         */

    }, {
        key: 'getFaceIdFromCoordinatesAndNormal',
        value: function getFaceIdFromCoordinatesAndNormal(id, normal, dimensions) {
            var ddd = dimensions[0] * dimensions[1] * dimensions[2];
            switch (normal) {// TODO boundary management...
                case 0:
                    return id - 1;
                case 2:
                    return ddd + id - dimensions[0];
                case 4:
                    return 2 * ddd + id - dimensions[0] * dimensions[1];

                case 1:
                    return id;
                case 3:
                    return ddd + id;
                case 5:
                    return 2 * ddd + id;
                default:
            }
        }

        // ADDITION ONLY

    }, {
        key: 'getFaceColorFromIdAndNormal',
        value: function getFaceColorFromIdAndNormal(chunk, x, y, z, direction) {
            var _this = chunk.what(x, y, z);
            var thisEmpty = _this === 0;
            var dimensions = chunk.dimensions;
            if (thisEmpty) {
                switch (direction) {
                    case 0:
                        // x-
                        if (x > 0) return chunk.what(x - 1, y, z);
                        break;

                    case 1:
                        // x+
                        if (x + 1 < dimensions[0]) return chunk.what(x + 1, y, z);
                        break;

                    case 2:
                        // y-
                        if (y > 0) return chunk.what(x, y - 1, z);
                        break;

                    case 3:
                        // y+
                        if (y + 1 < dimensions[1]) return chunk.what(x, y + 1, z);
                        break;

                    case 4:
                        // z-
                        if (z > 0) return chunk.what(x, y, z - 1);
                        break;

                    case 5:
                        // z+
                        if (z + 1 < dimensions[2]) return chunk.what(x, y, z + 1);
                        break;

                    default:
                }
            } else {
                return _this;
            }
            return 0;
        }
    }, {
        key: 'rawUpdateAfterEdition',
        value: function rawUpdateAfterEdition(chunk, id, x, y, z, addedFaces, removedFaces, isAddition) {
            // Compute updated faces.
            var dimensions = chunk.dimensions;

            var removedFaceIds = new Int32Array(removedFaces.length);
            var addedFaceIds = new Int32Array(addedFaces.length);

            for (var normal = 0, l = removedFaces.length; normal < l; ++normal) {
                if (!removedFaces[normal] && !addedFaces[normal]) {
                    removedFaceIds[normal] = addedFaceIds[normal] = -1;
                    continue;
                }
                var faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(id, normal, dimensions);

                if (removedFaces[normal]) removedFaceIds[normal] = faceId;else removedFaceIds[normal] = -1;
                if (addedFaces[normal]) addedFaceIds[normal] = faceId;else addedFaceIds[normal] = -1;
            }

            //console.log('UPDATING COMPONENTS');
            //console.log(removedFaceIds);
            //console.log(addedFaceIds);

            // Update components.
            var connectedComponents = chunk.connectedComponents;
            var fastComponents = chunk.fastComponents;
            var fastComponentsIds = chunk.fastComponentsIds;

            // Remove
            var oldComponent = null;
            for (var i = 0, _l = removedFaceIds.length; i < _l; ++i) {
                var fid = removedFaceIds[i];
                if (fid === -1) continue;

                var componentId = connectedComponents[fid];
                if (componentId === undefined) console.log('Face id ' + fid);
                if (componentId < 1) {
                    console.log("WARN: trying to remove a face that is not registered as boundary: " + "component id = " + componentId + ".");
                    continue;
                }
                oldComponent = componentId;

                var currentComponent = fastComponents[componentId];
                if (currentComponent === undefined) {
                    var e = new Error('BLD: skipping removal on component ' + componentId);
                    console.log(e.stack);
                    continue;
                }
                var index = _collections2.default.removeFromArray(currentComponent, fid);
                if (currentComponent.length === 0) delete fastComponents[componentId];

                var currentComponentsIds = fastComponentsIds[componentId];
                _collections2.default.removeFromArrayWithId(currentComponentsIds, index);
                if (currentComponentsIds.length === 0) delete fastComponentsIds[componentId];

                connectedComponents[fid] = 0;
            }

            // Insert
            var newColor = {};
            for (var _i = 0, _l2 = addedFaceIds.length; _i < _l2; ++_i) {
                var _fid = addedFaceIds[_i];
                if (_fid === -1) continue;

                // WARN this step is not topology-aware. Components are to be recomputed properly in the "divide" stage.
                var _componentId = oldComponent === null ? _collections2.default.generateId(fastComponents) : oldComponent;
                if (fastComponents[_componentId] === undefined) {
                    // TODO check in divide...
                    // TODO check borders with this approach
                    // TODO provide non-topo approach
                    // Somehow getting here means that the added block isn't topologically linked to any other
                    // component. So we have to create a new component id.
                    var _e = new Error('BLD: invalid component id: ' + _componentId + ' for insertion... BLDing.');
                    console.log(_e.stack);

                    fastComponents[_componentId] = [];
                    fastComponentsIds[_componentId] = [];
                    oldComponent = _componentId;
                }
                var location = _collections2.default.insert(_fid, fastComponents[_componentId]);
                var fastIds = fastComponentsIds[_componentId];

                var faceColor = UpdaterFace.getFaceColorFromIdAndNormal(chunk, x, y, z, _i);
                if (faceColor == 0) continue;

                if (isAddition) {
                    if (_i % 2 === 0) faceColor *= -1;
                } else {
                    if (_i % 2 !== 0) faceColor *= -1;
                }

                newColor[_i] = faceColor;
                fastIds.splice(location, 0, faceColor);
                connectedComponents[_fid] = _componentId;
            }

            // Update updates.
            /**
             * UPDATES FORMAT
             * [ {}, {}, {} ]
             * {} -> removed (faceIds)
             * {} -> added (faceId -> nature)
             * {} -> changedComponents (faceId -> new nature)
             */
            var updates = chunk.updates;
            var removedUpdt = updates[0];
            var addedUpdt = updates[1];
            var changedUpdt = updates[2];

            var nbp = _collections2.default.numberOfProperties;
            var updatesEmpty = nbp(removedUpdt) === 0 && nbp(addedUpdt) === 0 && nbp(changedUpdt) === 0;

            for (var _i2 = 0, _l3 = addedFaceIds.length; _i2 < _l3; ++_i2) {
                var _fid2 = addedFaceIds[_i2];
                if (_fid2 === -1) continue;

                if (!updatesEmpty && removedUpdt.hasOwnProperty(_fid2)) {
                    delete removedUpdt[_fid2]; // if it is marked as 'removed', then it exists in the original array
                    changedUpdt[_fid2] = newColor[_i2]; //connectedComponents[fid];
                } else {
                        addedUpdt[_fid2] = newColor[_i2]; // connectedComponents[fid];
                    }
            }

            for (var _i3 = 0, _l4 = removedFaceIds.length; _i3 < _l4; ++_i3) {
                var _fid3 = removedFaceIds[_i3];
                if (_fid3 === -1) continue;

                if (!updatesEmpty && addedUpdt.hasOwnProperty(_fid3)) {
                    delete addedUpdt[_fid3]; // if it is marked as 'added', then it does not exist in the original array
                } else {
                        removedUpdt[_fid3] = null;
                    }
            }
        }
    }, {
        key: 'divideConnectedComponents',
        value: function divideConnectedComponents(chunk, id, x, y, z, addedFaces) {
            var nbp = _collections2.default.numberOfProperties;
            /**
             * Idea: breadth-first search. (breadth for early detection of neighbour faces)
             * 1 face -> 4 candidates (3 per edge). recurse clockwise.
             * for each candidate (begin with the face aligned with its normal), validate first, push into 'mapped faces'
             * if not already in it, recurse next.
             * Mark each component with an index. If any of the new initial block faces is encountered during the search,
             * no need to begin a new breadth search from it.
             * Continue breadth searches until all initial faces are taken care of. The mapper may be reinit after each
             * search (and in the meanwhile the corresponding connected components must be updated, and given to the update
             * variable).
             */
            // TODO recurse on faces and separate effectively disconnected components.
            // TODO if chunk was updated after the last IO call, stack modifications in the chunk update variable.
            // Beware of component disappearance in client.
        }
    }, {
        key: 'detectTopologyChangeAfterDeletion',
        value: function detectTopologyChangeAfterDeletion(chunk, id, x, y, z) {
            // Criterion: pre-existing faces belonged to separate connected components.
            // N.B. We could have considered this a dual of topology change detection after addition.
            // and call detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z, removedFaces)
            // but it is computationally easier to check immediate neighborhoods for distinct CCs.

            var connectedComponents = chunk.connectedComponents;
            var capacity = chunk.capacity;
            var dimensions = chunk.dimensions;
            var facePlusId = chunk._toId(x, y, z);
            var ccids = [];

            if (x < dimensions[0]) ccids.push(connectedComponents[facePlusId]);
            if (y < dimensions[1]) ccids.push(connectedComponents[capacity + facePlusId]);
            if (z < dimensions[2]) ccids.push(connectedComponents[2 * capacity + facePlusId]);
            if (x > 0) ccids.push(connectedComponents[chunk._toId(x - 1, y, z)]);
            if (y > 0) ccids.push(connectedComponents[capacity + chunk._toId(x, y - 1, z)]);
            if (z > 0) ccids.push(connectedComponents[2 * capacity + chunk._toId(x, y, z - 1)]);

            var first = ccids[0];
            for (var i = 1; i < ccids.length; ++i) {
                if (ccids[i] !== first) return true;
            }
            return false;
        }
    }, {
        key: 'addFaceToModel',
        value: function addFaceToModel(chunk, faceId, kind) {
            var connectedComponents = chunk.connectedComponents;
            var fastComponents = chunk.fastComponents;
            var fastComponentsIds = chunk.fastComponentsIds;

            var cc = 1; // TODO Topology
            connectedComponents[faceId] = cc;
            if (fastComponents.hasOwnProperty(cc)) {
                fastComponents[cc].push(faceId);
                fastComponentsIds[cc].push(kind);
            } else {
                console.log('ERROR @addFaceToModel: fastComponents doesnt have a ' + cc + ' component. ' + 'face id: ' + faceId + ' kind: ' + kind);
                fastComponents[cc] = [faceId];
                fastComponentsIds[cc] = [kind];
            }
        }
    }, {
        key: 'removeFaceFromModel',
        value: function removeFaceFromModel(chunk, faceId) {
            var connectedComponents = chunk.connectedComponents;
            var fastComponents = chunk.fastComponents;
            var fastComponentsIds = chunk.fastComponentsIds;

            var cc = connectedComponents[faceId];
            var id = _collections2.default.removeFromArray(fastComponents[cc], faceId);
            _collections2.default.removeFromArrayWithId(fastComponentsIds[cc], id);
            connectedComponents[faceId] = 0;
        }
    }, {
        key: 'updateFace',
        value: function updateFace(w, wOrigin, fid, chunk, isAddition) {
            var updates = chunk.updates;
            // TODO REMOVE FACES FROM MODEL.

            // Adding a block.
            if (isAddition) {
                if (w !== 0) {
                    // remove face
                    if (updates[1].hasOwnProperty(fid)) delete updates[1][fid];else updates[0][fid] = null;
                    UpdaterFace.removeFaceFromModel(chunk, fid);
                } else {
                    // add face
                    if (updates[0].hasOwnProperty(fid)) {
                        delete updates[0][fid];
                        updates[2][fid] = wOrigin;
                    } else updates[1][fid] = wOrigin;
                    UpdaterFace.addFaceToModel(chunk, fid, wOrigin);
                }

                // Removing a block.
            } else {
                    if (w !== 0) {
                        // add face
                        if (updates[0].hasOwnProperty(fid)) {
                            delete updates[0][fid];
                            updates[2][fid] = w;
                        } else updates[1][fid] = w;
                        UpdaterFace.addFaceToModel(chunk, fid, w);
                    } else {
                        // remove face
                        if (updates[1].hasOwnProperty(fid)) delete updates[1][fid];else updates[0][fid] = null;
                        UpdaterFace.removeFaceFromModel(chunk, fid);
                    }
                }
        }
    }, {
        key: 'updateFacesOnBoundary',
        value: function updateFacesOnBoundary(chunk, x, y, z, isAddition) {
            var capacity = chunk.capacity;
            var dimensions = chunk.dimensions;

            var updatedChunks = new _set2.default();

            if (x === dimensions[0] - 1) {
                var wOrigin = chunk.what(x, y, z);
                var w = chunk.neighbourWhat(x + 1, y, z);
                if (!isAddition) {
                    w *= -1;
                    wOrigin *= -1;
                }
                var fid = chunk._toId(x, y, z);
                UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
            }

            if (y === dimensions[1] - 1) {
                var _wOrigin = chunk.what(x, y, z);
                var _w = chunk.neighbourWhat(x, y + 1, z);
                if (!isAddition) {
                    _w *= -1;
                    _wOrigin *= -1;
                }
                var _fid4 = capacity + chunk._toId(x, y, z);
                UpdaterFace.updateFace(_w, _wOrigin, _fid4, chunk, isAddition);
            }

            if (z === dimensions[2] - 1) {
                var _wOrigin2 = chunk.what(x, y, z);
                var _w2 = chunk.neighbourContains(x, y, z + 1);
                if (!isAddition) {
                    _w2 *= -1;
                    _wOrigin2 *= -1;
                }
                var _fid5 = 2 * capacity + chunk._toId(x, y, z);
                UpdaterFace.updateFace(_w2, _wOrigin2, _fid5, chunk, isAddition);
            }

            if (x === 0) {
                var c = chunk.getNeighbourChunkFromRelativeCoordinates(x - 1, y, z);
                var newX = chunk.dimensions[0] - 1;
                var _fid6 = c._toId(newX, y, z);
                var _wOrigin3 = chunk.what(x, y, z);
                var _w3 = c.what(newX, y, z);
                if (isAddition) {
                    _w3 *= -1;
                    _wOrigin3 *= -1;
                }
                UpdaterFace.updateFace(_w3, _wOrigin3, _fid6, c, isAddition);
                updatedChunks.add(c);
            }

            if (y === 0) {
                var _c = chunk.getNeighbourChunkFromRelativeCoordinates(x, y - 1, z);
                var newY = chunk.dimensions[1] - 1;
                var _fid7 = capacity + _c._toId(x, newY, z);
                var _wOrigin4 = chunk.what(x, y, z);
                var _w4 = _c.what(x, newY, z);
                if (isAddition) {
                    _w4 *= -1;
                    _wOrigin4 *= -1;
                }
                UpdaterFace.updateFace(_w4, _wOrigin4, _fid7, _c, isAddition);
                updatedChunks.add(_c);
            }

            if (z === 0) {
                var _c2 = chunk.getNeighbourChunkFromRelativeCoordinates(x, y, z - 1);
                var newZ = chunk.dimensions[2] - 1;
                var _fid8 = 2 * capacity + _c2._toId(x, y, newZ);
                var _wOrigin5 = chunk.what(x, y, z);
                var _w5 = _c2.what(x, y, newZ);
                if (isAddition) {
                    _w5 *= -1;
                    _wOrigin5 *= -1;
                }
                UpdaterFace.updateFace(_w5, _wOrigin5, _fid8, _c2, isAddition);
                updatedChunks.add(_c2);
            }

            return updatedChunks;
        }
    }, {
        key: 'updateSurfaceFacesAfterDeletion',
        value: function updateSurfaceFacesAfterDeletion(chunk, id, x, y, z) {
            var dimensions = chunk.dimensions;

            // Compute concerned faces.
            var addedFaces = [false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false // z+
            ];

            if (x > 0 && chunk.contains(x - 1, y, z)) addedFaces[0] = true;
            if (x < dimensions[0] - 1 && chunk.contains(x + 1, y, z)) addedFaces[1] = true;
            if (y > 0 && chunk.contains(x, y - 1, z)) addedFaces[2] = true;
            if (y < dimensions[1] - 1 && chunk.contains(x, y + 1, z)) addedFaces[3] = true;
            if (z > 0 && chunk.contains(x, y, z - 1)) addedFaces[4] = true;
            if (z < dimensions[2] - 1 && chunk.contains(x, y, z + 1)) addedFaces[5] = true;

            var removedFaces = [!addedFaces[0] && x > 0, // x-
            !addedFaces[1] && x < dimensions[0] - 1, // x+
            !addedFaces[2] && y > 0, // y-
            !addedFaces[3] && y < dimensions[1] - 1, // y+
            !addedFaces[4] && z > 0, // z-
            !addedFaces[5] && z < dimensions[2] - 1 // z+
            ];

            UpdaterFace.rawUpdateAfterEdition(chunk, id, x, y, z, addedFaces, removedFaces, false);

            if (UpdaterFace.detectTopologyChangeAfterDeletion(chunk, id, x, y, z))
                // N.B. the provided criterion gives an immediate, exact answer to the topology request.
                UpdaterFace.mergeComponents(chunk, id, x, y, z);

            // Boundaries: topology-preserving updates
            return UpdaterFace.updateFacesOnBoundary(chunk, x, y, z, false);
        }
    }, {
        key: 'mergeComponents',
        value: function mergeComponents(chunk, id, x, y, z) {
            // TODO deletion version (much easier)
            // Beware of !components in client.
        }
    }]);
    return UpdaterFace;
}();

exports.default = UpdaterFace;
//# sourceMappingURL=updater_face.js.map
