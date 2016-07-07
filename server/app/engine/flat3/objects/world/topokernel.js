/**
 *
 */

'use strict';

import CollectionUtils from '../../../../math/collections/util';
import TopoIterator from './topoiterator';

class TopoKernel {

    static removeSurfaceBlock(surfaceBlocks, chunk, x, y, z) {
        surfaceBlocks[z].splice(surfaceBlocks[z].indexOf(chunk._toId(x, y, z)));
    }

    static addSurfaceBlock(surfaceBlocks, chunk, x, y, z) {
        const id = chunk._toId(x, y, z);
        if (!surfaceBlocks.hasOwnProperty(z)) surfaceBlocks[z] = [id];
        else CollectionUtils.insert(id, surfaceBlocks[z]);
    }

    // The difficulty is to keep layered surfaceBlocks sorted.
    static updateSurfaceBlocksAfterAddition(chunk, id, x, y, z) {
        let surfaceBlocks = chunk.surfaceBlocks;
        let dimensions = chunk.dimensions;
        let xp = false; let xm = false;
        let yp = false; let ym = false;
        let zp = false; let zm = false;

        // Update (x+1, x-1) blocks.
        if (x > 0 && chunk.contains(x-1, y, z)) {
            xm = true;
            if (
                (y<0 || chunk.contains(x-1, y-1, z)) && (y>=dimensions[1] || chunk.contains(x-1, y+1, z)) &&
                (z<0 || chunk.contains(x-1, y, z-1)) && (z>=dimensions[2] || chunk.contains(x-1, y, z+1)) &&
                (x-2<0 || chunk.contains(x-2, y, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x-1, y, z);
        }
        if (x < dimensions[0] && chunk.contains(x+1, y, z)) {
            xp = true;
            if (
                (y<0 || chunk.contains(x+1, y-1, z)) && (y>=dimensions[1] || chunk.contains(x+1, y+1, z)) &&
                (z<0 || chunk.contains(x+1, y, z-1)) && (z>=dimensions[2] || chunk.contains(x+1, y, z+1)) &&
                (x+2>=dimensions[0] || chunk.contains(x+2, y, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x+1, y, z);
        }

        // Update (y+1, y-1) blocks.
        if (y > 0 && chunk.contains(x, y-1, z)) {
            ym = true;
            if (
                (x<0 || chunk.contains(x-1, y-1, z)) && (x>=dimensions[0] || chunk.contains(x+1, y-1, z)) &&
                (z<0 || chunk.contains(x, y-1, z-1)) && (z>=dimensions[2] || chunk.contains(x, y-1, z+1)) &&
                (y-2<0 || chunk.contains(x, y-2, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y-1, z);
        }
        if (y < dimensions[1] && chunk.contains(x, y+1, z)) {
            yp = true;
            if (
                (x<0 || chunk.contains(x-1, y+1, z)) && (x>=dimensions[0] || chunk.contains(x+1, y+1, z)) &&
                (z<0 || chunk.contains(x, y+1, z-1)) && (z>=dimensions[2] || chunk.contains(x, y, z+1)) &&
                (y+2>=dimensions[1] || chunk.contains(x, y+2, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y+1, z);
        }

        // Update (z-1, z+1) blocks.
        if (z > 0 && chunk.contains(x, y, z-1)) {
            zm = true;
            if (
                (x<0 || chunk.contains(x-1, y, z-1)) && (x>=dimensions[0] || chunk.contains(x+1, y, z-1)) &&
                (y<0 || chunk.contains(x, y-1, z-1)) && (y>=dimensions[1] || chunk.contains(x, y+1, z-1)) &&
                (z-2<0 || chunk.contains(x, y, z-2))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z-1);
        }
        if (z < dimensions[2] && chunk.contains(x, y, z+1)) {
            zp = true;
            if (
                (x<0 || chunk.contains(x-1, y, z+1)) && (x>=dimensions[0] || chunk.contains(x+1, y, z+1)) &&
                (z<0 || chunk.contains(x, y-1, z+1)) && (y>=dimensions[1] || chunk.contains(x, y+1, z+1)) &&
                (z+2>=dimensions[2] || chunk.contains(x, y, z+2))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z+1);
        }

        // Update current block.
        if (!(xm && ym && xp && yp && zm && zp)) TopoKernel.addSurfaceBlock(surfaceBlocks, chunk, x, y, z);
    }

    static detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, faces) {
        // Criterion: at least 2 surface faces that do not link on the inserted cube.
        // i.e. if blocking edges form a cycle.

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
        if (x < dimensions[0] && !chunk.contains(x+1, y, z)) addedFaces[1] = true;
        if (y > 0 && !chunk.contains(x, y-1, z)) addedFaces[2] = true;
        if (y < dimensions[1] && !chunk.contains(x, y+1, z)) addedFaces[3] = true;
        if (z > 0 && !chunk.contains(x, y, z-1)) addedFaces[4] = true;
        if (z < dimensions[2] && !chunk.contains(x, y, z+1)) addedFaces[5] = true;

        TopoKernel.rawUpdateAfterAddition(chunk, id, x, y, z, addedFaces);

        if (TopoKernel.detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, addedFaces))
            TopoKernel.divideConnectedComponents(chunk, id, x, y, z, addedFaces);
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
        let checkOther = (_this === 0);
        let dimensions = chunk.dimensions;
        switch (direction) {
            case 0:
                if (checkOther && x > 0) return chunk.what(x-1, y, z);
                else return _this;
            case 1:
                if (checkOther && x+1 < dimensions[0]) return chunk.what(x+1, y, z);
                else return _this;
            case 2:
                if (checkOther && y > 0) return chunk.what(x, y-1, z);
                else return _this;
            case 3:
                if (checkOther && y+1 < dimensions[1]) return chunk.what(x, y+1, z);
                else return _this;
            case 4:
                if (checkOther && z > 0) return chunk.what(x, y, z-1);
                else return _this;
            case 5:
                if (checkOther && z+1 < dimensions[2]) return chunk.what(x, y, z+1);
                else return _this;
            default:
        }
    }

    static rawUpdateAfterAddition(chunk, id, x, y, z, addedFaces) {
        // Compute updated faces.
        let dimensions = chunk.dimensions;
        let removedFaces = [
           !addedFaces[0] && x > 0,             // x-
           !addedFaces[1] && x < dimensions[0], // x+
           !addedFaces[2] && y > 0,             // y-
           !addedFaces[3] && y < dimensions[1], // y+
           !addedFaces[4] && z > 0,             // z-
           !addedFaces[5] && z < dimensions[2]  // z+
            // N.B. whatever the block update, there will always be 6 modified faces (non-boundary case).
        ];
        let removedFaceIds = [];
        let addedFaceIds = [];
        for (let normal = 0; normal < removedFaces.length; ++normal) {
            if (!removedFaces[normal] && !addedFaces[normal]) continue;
            let faceId = TopoKernel.getFaceIdFromCoordinatesAndNormal(id, normal, dimensions);

            if (removedFaces[normal]) removedFaceIds.push(faceId);
            if (addedFaces[normal]) addedFaceIds.push(faceId);
        }

        console.log('UPDATING COMPONENTS');
        console.log(removedFaceIds);
        console.log(addedFaceIds);

        // Update components.
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;
        // Remove
        let oldComponent = null;
        let blocks = chunk.blocks;
        let capacity = chunk.capacity;
        for (let i = 0; i<removedFaceIds.length; ++i) {
            const fid = removedFaceIds[i];
            const componentId = connectedComponents[fid];
            console.log('Component id ' + componentId);
            if (componentId < 1) {
                console.log("WARNING: TRYING TO REMOVE A FACE THAT IS NOT REGISTERED AS BOUNDARY");
                continue;
            }
            oldComponent = componentId;

            let currentComponent = fastComponents[componentId];
            CollectionUtils.removeFromArray(currentComponent, fid);
            if (currentComponent.length === 0) delete fastComponents[componentId];

            let currentComponentsIds = fastComponentsIds[componentId];
            CollectionUtils.removeFromArray(currentComponentsIds, blocks[Math.abs(fid)%capacity]);
            if (currentComponentsIds.length === 0) delete fastComponentsIds[componentId];

            connectedComponents[fid] = 0;
        }
        // Insert
        let newColor = {};
        for (let i = 0; i<addedFaceIds.length; ++i) {
            const fid = addedFaceIds[i];
            // WARN this step is not topology-aware. Components are to be recomputed properly in the "divide" stage.
            const componentId = oldComponent === null ? CollectionUtils.generateId(fastComponents): oldComponent;
            const location = CollectionUtils.insert(fid, fastComponents[componentId]);
            var fastIds = fastComponentsIds[componentId];

            let faceColor = TopoKernel.getFaceColorFromIdAndNormal(chunk, x, y, z, i);
            if (!(i%2)) faceColor *= -1;
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
        const updatesEmpty = (
            CollectionUtils.numberOfProperties(removedUpdt) === 0 &&
            CollectionUtils.numberOfProperties(addedUpdt) === 0 &&
            CollectionUtils.numberOfProperties(changedUpdt) === 0
        );
        for (let i = 0; i<addedFaceIds.length; ++i) {
            let fid = addedFaceIds[i];
            if (!updatesEmpty && removedUpdt.hasOwnProperty(fid)) {
                delete removedUpdt[fid]; // if it is marked as 'removed', then it exists in the original array
                changedUpdt[fid] = newColor[i]; //connectedComponents[fid];
            } else {
                addedUpdt[fid] = newColor[i]; // connectedComponents[fid];
            }
        }
        for (let i = 0; i<removedFaceIds.length; ++i) {
            let fid = Math.abs(removedFaceIds[i]);
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
    }

    // BLOCK DELETION
    static updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z) {
        TopoKernel.rawUpdateAfterDeletion(chunk, id, x, y, z);

        if (TopoKernel.detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z))
            TopoKernel.mergeComponents(chunk, id, x, y, z);
    }

    static rawUpdateAfterDeletion(chunk, id, x, y, z) {
        // TODO delete.
    }

    static detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z) {
        // Criterion: pre-existing faces belonged to separate connected components.
        // TODO deletion version (easier)
    }

    static mergeComponents(chunk, id, x, y, z) {
        // TODO deletion version (easier)
    }

}

export default TopoKernel;
