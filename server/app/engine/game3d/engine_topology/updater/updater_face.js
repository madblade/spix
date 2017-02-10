/**
 *
 */

'use strict';

import CollectionUtils from '../../../math/collections';
import CSFX from '../../engine_consistency/builder/surface_faces_builder'; // Get linkage strategy.

class UpdaterFace {

    static detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, faces) {
        // Criterion: at least 2 surface faces that do not link on the inserted cube.
        // i.e. if blocking edges form a cycle.
        // Detects POTENTIAL local topology changes.

        // Compute blocking edges.
        let blockingEdges = [];
        // x-
        if (faces[0] && faces[2] && chunk.contains(x-1, y-1, z)) blockingEdges.push([0, 4]);
        if (faces[0] && faces[3] && chunk.contains(x-1, y+1, z)) blockingEdges.push([3, 7]);
        if (faces[0] && faces[4] && chunk.contains(x-1, y, z-1)) blockingEdges.push([4, 7]);
        if (faces[0] && faces[5] && chunk.contains(x-1, y, z+1)) blockingEdges.push([0, 3]);
        // x+
        if (faces[1] && faces[2] && chunk.contains(x+1, y-1, z)) blockingEdges.push([1, 5]);
        if (faces[1] && faces[3] && chunk.contains(x+1, y+1, z)) blockingEdges.push([2, 6]);
        if (faces[1] && faces[4] && chunk.contains(x+1, y, z-1)) blockingEdges.push([5, 6]);
        if (faces[1] && faces[5] && chunk.contains(x+1, y, z+1)) blockingEdges.push([1, 2]);
        // y+-z
        if (faces[2] && faces[4] && chunk.contains(x, y-1, z-1)) blockingEdges.push([4, 5]);
        if (faces[2] && faces[5] && chunk.contains(x, y-1, z+1)) blockingEdges.push([0, 1]);
        if (faces[3] && faces[4] && chunk.contains(x, y+1, z-1)) blockingEdges.push([6, 7]);
        if (faces[3] && faces[5] && chunk.contains(x, y+1, z+1)) blockingEdges.push([2, 3]);

        // Detect loop.
        let ls = [];
        for (let i = 0; i < blockingEdges.length; ++i) {
            let bi = blockingEdges[i];
            let found = false;

            for (let j = 0; j < ls.length; ++j) {
                let last = ls[j].length - 1;
                if (ls[j][last] === bi[0]) {
                    ls[j].push(bi[1]);
                    found = true;
                }
                if (ls[j][last] === bi[1]) {
                    ls[j].push(bi[0]);
                    found = true;
                }
                if (ls[j][0] === ls[j][last+1]) { // Loop detected.
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
    static updateSurfaceFacesAfterAddition(chunk, id, x, y, z) {
        let dimensions = chunk.dimensions;

        // Compute concerned faces.
        let addedFaces = [
            false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false  // z+
        ];

        if (x > 0 && !chunk.contains(x-1, y, z)) addedFaces[0] = true;
        if (x < dimensions[0]-1 && !chunk.contains(x+1, y, z)) addedFaces[1] = true;
        if (y > 0 && !chunk.contains(x, y-1, z)) addedFaces[2] = true;
        if (y < dimensions[1]-1 && !chunk.contains(x, y+1, z)) addedFaces[3] = true;
        if (z > 0 && !chunk.contains(x, y, z-1)) addedFaces[4] = true;
        if (z < dimensions[2]-1 && !chunk.contains(x, y, z+1)) addedFaces[5] = true;

        let removedFaces = [
            !addedFaces[0] && x > 0,             // x-
            !addedFaces[1] && x < dimensions[0]-1, // x+
            !addedFaces[2] && y > 0,             // y-
            !addedFaces[3] && y < dimensions[1]-1, // y+
            !addedFaces[4] && z > 0,             // z-
            !addedFaces[5] && z < dimensions[2]-1  // z+
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
    static getFaceIdFromCoordinatesAndNormal(id, normal, dimensions) {
        let ddd = dimensions[0]*dimensions[1]*dimensions[2];
        switch (normal) { // TODO boundary management...
            case 0: return id - 1;
            case 2: return ddd + id - dimensions[0];
            case 4: return 2*ddd + id - dimensions[0]*dimensions[1];

            case 1: return id;
            case 3: return ddd + id;
            case 5: return 2*ddd + id;
            default:
        }
    }

    // ADDITION ONLY
    static getFaceColorFromIdAndNormal(chunk, x, y, z, direction) {
        let _this = chunk.what(x, y, z);
        let thisEmpty = (_this === 0);
        let dimensions = chunk.dimensions;
        if (thisEmpty) {
            switch (direction) {
                case 0: // x-
                    if (x > 0) return chunk.what(x-1, y, z);
                    break;

                case 1: // x+
                    if (x+1 < dimensions[0]) return chunk.what(x+1, y, z);
                    break;

                case 2: // y-
                    if (y > 0) return chunk.what(x, y-1, z);
                    break;

                case 3: // y+
                    if (y+1 < dimensions[1]) return chunk.what(x, y+1, z);
                    break;

                case 4: // z-
                    if (z > 0) return chunk.what(x, y, z-1);
                    break;

                case 5: // z+
                    if (z+1 < dimensions[2]) return chunk.what(x, y, z+1);
                    break;

                default:
            }
        } else {
            return _this;
        }
        return 0;
    }

    static rawUpdateAfterEdition(chunk, id, x, y, z, addedFaces, removedFaces, isAddition) {
        // Compute updated faces.
        let dimensions = chunk.dimensions;

        let removedFaceIds = new Int32Array(removedFaces.length);
        let addedFaceIds = new Int32Array(addedFaces.length);

        for (let normal = 0, l = removedFaces.length; normal < l; ++normal) {
            if (!removedFaces[normal] && !addedFaces[normal]) {
                removedFaceIds[normal] = addedFaceIds[normal] = -1;
                continue;
            }
            let faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(id, normal, dimensions);

            if (removedFaces[normal]) removedFaceIds[normal] = (faceId);
            else removedFaceIds[normal] = -1;
            if (addedFaces[normal]) addedFaceIds[normal] = (faceId);
            else addedFaceIds[normal] = -1;
        }

        //console.log('UPDATING COMPONENTS');
        //console.log(removedFaceIds);
        //console.log(addedFaceIds);

        // Update components.
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        // Remove
        let oldComponent = null;
        for (let i = 0, l = removedFaceIds.length; i < l; ++i) {
            const fid = removedFaceIds[i];
            if (fid === -1) continue;

            const componentId = connectedComponents[fid];
            if (componentId === undefined) console.log('Face id ' + fid);
            if (componentId < 1) {
                console.log("WARN: trying to remove a face that is not registered as boundary: " +
                    "component id = " + componentId + ".");
                continue;
            }
            oldComponent = componentId;

            let currentComponent = fastComponents[componentId];
            if (currentComponent === undefined) {
                let e = new Error('BLD: skipping removal on component ' + componentId);
                console.log(e.stack);
                continue;
            }
            let index = CollectionUtils.removeFromArray(currentComponent, fid);
            if (currentComponent.length === 0) delete fastComponents[componentId];

            let currentComponentsIds = fastComponentsIds[componentId];
            CollectionUtils.removeFromArrayWithId(currentComponentsIds, index);
            if (currentComponentsIds.length === 0) delete fastComponentsIds[componentId];

            connectedComponents[fid] = 0;
        }

        // Insert
        let newColor = {};
        for (let i = 0, l = addedFaceIds.length; i < l; ++i) {
            const fid = addedFaceIds[i];
            if (fid === -1) continue;

            // WARN this step is not topology-aware. Components are to be recomputed properly in the "divide" stage.
            const componentId = CSFX.forceOneComponentPerChunk ? 1 :
                (oldComponent === null ? CollectionUtils.generateId(fastComponents): oldComponent);

            if (fastComponents[componentId] === undefined) {
                // TODO check in divide...
                // TODO check borders with this approach
                // TODO provide non-topo approach
                // Somehow getting here means that the added block isn't topologically linked to any other
                // component. So we have to create a new component id.
                let e = new Error('BLD: invalid component id: ' + componentId + ' for insertion... BLDing.');
                console.log(e.stack);

                fastComponents[componentId] = [];
                fastComponentsIds[componentId] = [];
                oldComponent = componentId;
            }
            const location = CollectionUtils.insert(fid, fastComponents[componentId]);
            var fastIds = fastComponentsIds[componentId];

            let faceColor = UpdaterFace.getFaceColorFromIdAndNormal(chunk, x, y, z, i);
            if (faceColor == 0) continue;

            if (isAddition) {
                if (i%2 === 0) faceColor *= -1;
            } else {
                if (i%2 !== 0) faceColor *= -1;
            }

            newColor[i] = faceColor;
            fastIds.splice(location, 0, faceColor);
            connectedComponents[fid] = componentId;
        }

        // Update updates.
        /**
         * UPDATES FORMAT
         * [ {}, {}, {} ]
         * {} -> removed (faceIds)
         * {} -> added (faceId -> nature)
         * {} -> changedComponents (faceId -> new nature)
         */
        let updates = chunk.updates;
        let removedUpdt = updates[0];
        let addedUpdt = updates[1];
        let changedUpdt = updates[2];

        var nbp = CollectionUtils.numberOfProperties;
        const updatesEmpty = nbp(removedUpdt) === 0 && nbp(addedUpdt) === 0 && nbp(changedUpdt) === 0;

        for (let i = 0, l = addedFaceIds.length; i < l; ++i) {
            let fid = addedFaceIds[i];
            if (fid === -1) continue;

            if (!updatesEmpty && removedUpdt.hasOwnProperty(fid)) {
                delete removedUpdt[fid]; // if it is marked as 'removed', then it exists in the original array
                changedUpdt[fid] = newColor[i]; //connectedComponents[fid];
            } else {
                addedUpdt[fid] = newColor[i]; // connectedComponents[fid];
            }
        }

        for (let i = 0, l = removedFaceIds.length; i < l; ++i) {
            let fid = removedFaceIds[i];
            if (fid === -1) continue;

            if (!updatesEmpty && addedUpdt.hasOwnProperty(fid)) {
                delete addedUpdt[fid]; // if it is marked as 'added', then it does not exist in the original array
            } else {
                removedUpdt[fid] = null;
            }
        }
    }

    static divideConnectedComponents(chunk, id, x, y, z, addedFaces) {
        var nbp = CollectionUtils.numberOfProperties;
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

    static detectTopologyChangeAfterDeletion(chunk, id, x, y, z) {
        // Criterion: pre-existing faces belonged to separate connected components.
        // N.B. We could have considered this a dual of topology change detection after addition.
        // and call detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z, removedFaces)
        // but it is computationally easier to check immediate neighborhoods for distinct CCs.

        var connectedComponents = chunk.connectedComponents;
        const capacity = chunk.capacity;
        let dimensions = chunk.dimensions;
        const facePlusId = chunk._toId(x, y, z);
        let ccids = [];

        if (x < dimensions[0]) ccids.push(connectedComponents[facePlusId]);
        if (y < dimensions[1]) ccids.push(connectedComponents[capacity + facePlusId]);
        if (z < dimensions[2]) ccids.push(connectedComponents[2 * capacity + facePlusId]);
        if (x > 0) ccids.push(connectedComponents[chunk._toId(x-1, y, z)]);
        if (y > 0) ccids.push(connectedComponents[capacity + chunk._toId(x, y-1, z)]);
        if (z > 0) ccids.push(connectedComponents[2 * capacity + chunk._toId(x, y, z-1)]);

        let first = ccids[0];
        for (let i = 1; i<ccids.length; ++i) {
            if (ccids[i] !== first) return true;
        }
        return false;
    }

    static addFaceToModel(chunk, faceId, kind) {
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        const cc = 1; // TODO Topology
        connectedComponents[faceId] = cc;
        if (fastComponents.hasOwnProperty(cc)) {
            fastComponents[cc].push(faceId);
            fastComponentsIds[cc].push(kind);
        } else {
            console.log('ERROR @addFaceToModel: fastComponents doesnt have a ' + cc + ' component. ' +
                'face id: ' + faceId + ' kind: ' + kind);
            fastComponents[cc] = [faceId];
            fastComponentsIds[cc] = [kind];
        }
    }

    static removeFaceFromModel(chunk, faceId) {
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        let cc = connectedComponents[faceId];
        const id = CollectionUtils.removeFromArray(fastComponents[cc], faceId);
        CollectionUtils.removeFromArrayWithId(fastComponentsIds[cc], id);
        connectedComponents[faceId] = 0;
    }

    static updateFace(w, wOrigin, fid, chunk, isAddition) {
        let updates = chunk.updates;
        // TODO REMOVE FACES FROM MODEL.

        // Adding a block.
        if (isAddition) {
            if (w !== 0) { // remove face
                if (updates[1].hasOwnProperty(fid)) delete updates[1][fid];
                else updates[0][fid] = null;
                UpdaterFace.removeFaceFromModel(chunk, fid);

            } else { // add face
                if (updates[0].hasOwnProperty(fid)) {
                    delete updates[0][fid];
                    updates[2][fid] = wOrigin;
                }
                else updates[1][fid] = wOrigin;
                UpdaterFace.addFaceToModel(chunk, fid, wOrigin);
            }

        // Removing a block.
        } else {
            if (w !== 0) { // add face
                if (updates[0].hasOwnProperty(fid)) {
                    delete updates[0][fid];
                    updates[2][fid] = w;
                }
                else updates[1][fid] = w;
                UpdaterFace.addFaceToModel(chunk, fid, w);

            } else { // remove face
                if (updates[1].hasOwnProperty(fid)) delete updates[1][fid];
                else updates[0][fid] = null;
                UpdaterFace.removeFaceFromModel(chunk, fid);
            }
        }
    }

    static updateFacesOnBoundary(chunk, x, y, z, isAddition) {
        const capacity = chunk.capacity;
        const dimensions = chunk.dimensions;

        var updatedChunks = new Set();

        if (x === dimensions[0] - 1) {
            let wOrigin = chunk.what(x, y, z);
            let w = chunk.neighbourWhat(x + 1, y, z);
            if (!isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            let fid = chunk._toId(x, y, z);
            UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
        }

        if (y === dimensions[1] - 1) {
            let wOrigin = chunk.what(x, y, z);
            let w = chunk.neighbourWhat(x, y + 1, z);
            if (!isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            let fid = capacity + chunk._toId(x, y, z);
            UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
        }

        if (z === dimensions[2] - 1) {
            let wOrigin = chunk.what(x, y, z);
            let w = chunk.neighbourWhat(x, y, z + 1);
            if (!isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            let fid = 2 * capacity + chunk._toId(x, y, z);
            UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
        }

        if (x === 0) {
            let c = chunk.getNeighbourChunkFromRelativeCoordinates(x - 1, y, z);
            let newX = chunk.dimensions[0] - 1;
            let fid = c._toId(newX, y, z);
            let wOrigin = chunk.what(x, y, z);
            let w = c.what(newX, y, z);
            if (isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            UpdaterFace.updateFace(w, wOrigin, fid, c, isAddition);
            updatedChunks.add(c);
        }

        if (y === 0) {
            let c = chunk.getNeighbourChunkFromRelativeCoordinates(x, y - 1, z);
            let newY = chunk.dimensions[1] - 1;
            let fid = capacity + c._toId(x, newY, z);
            let wOrigin = chunk.what(x, y, z);
            let w = c.what(x, newY, z);
            if (isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            UpdaterFace.updateFace(w, wOrigin, fid, c, isAddition);
            updatedChunks.add(c);
        }

        if (z === 0) {
            let c = chunk.getNeighbourChunkFromRelativeCoordinates(x, y, z - 1);
            let newZ = chunk.dimensions[2] - 1;
            let fid = 2 * capacity + c._toId(x, y, newZ);
            let wOrigin = chunk.what(x, y, z);
            let w = c.what(x, y, newZ);
            if (isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            UpdaterFace.updateFace(w, wOrigin, fid, c, isAddition);
            updatedChunks.add(c);
        }

        return updatedChunks;
    }

    static updateSurfaceFacesAfterDeletion(chunk, id, x, y, z) {
        let dimensions = chunk.dimensions;

        // Compute concerned faces.
        let addedFaces = [
            false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false  // z+
        ];

        if (x > 0 && chunk.contains(x-1, y, z)) addedFaces[0] = true;
        if (x < dimensions[0]-1 && chunk.contains(x+1, y, z)) addedFaces[1] = true;
        if (y > 0 && chunk.contains(x, y-1, z)) addedFaces[2] = true;
        if (y < dimensions[1]-1 && chunk.contains(x, y+1, z)) addedFaces[3] = true;
        if (z > 0 && chunk.contains(x, y, z-1)) addedFaces[4] = true;
        if (z < dimensions[2]-1 && chunk.contains(x, y, z+1)) addedFaces[5] = true;

        let removedFaces = [
            !addedFaces[0] && x > 0,             // x-
            !addedFaces[1] && x < dimensions[0]-1, // x+
            !addedFaces[2] && y > 0,             // y-
            !addedFaces[3] && y < dimensions[1]-1, // y+
            !addedFaces[4] && z > 0,             // z-
            !addedFaces[5] && z < dimensions[2]-1  // z+
        ];

        UpdaterFace.rawUpdateAfterEdition(chunk, id, x, y, z, addedFaces, removedFaces, false);

        if (UpdaterFace.detectTopologyChangeAfterDeletion(chunk, id, x, y, z))
        // N.B. the provided criterion gives an immediate, exact answer to the topology request.
            UpdaterFace.mergeComponents(chunk, id, x, y, z);

        // Boundaries: topology-preserving updates
        return UpdaterFace.updateFacesOnBoundary(chunk, x, y, z, false);
    }

    static mergeComponents(chunk, id, x, y, z) {
        // TODO deletion version (much easier)
        // Beware of !components in client.
    }
    
}

export default UpdaterFace;
