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

    static detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z) {
        // Criterion: at least 2 surface faces that do not link on the inserted cube.
        // i.e. if blocking edges form a cycle.
        let dimensions = chunk.dimensions;

        // Compute concerned faces.
        let faces = [
            false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false  // z+
        ];
        if (x > 0 && !chunk.contains(x-1, y, z)) faces[0] = true;
        if (x < dimensions[0]-1 && !chunk.contains(x+1, y, z)) faces[1] = true;
        if (y > 0 && !chunk.contains(x, y-1, z)) faces[2] = true;
        if (y < dimensions[1]-1 && !chunk.contains(x, y+1, z)) faces[3] = true;
        if (z > 0 && !chunk.contains(x, y, z-1)) faces[4] = true;
        if (z < dimensions[2]-1 && !chunk.contains(x, y, z+1)) faces[5] = true;

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

    // The difficulty is to determine which surface faces belong to which component after an addition.
    static updateSurfaceFacesAfterAddition(chunk, id, x, y, z) {
        /**
         * updates: Component id -> nature (deleted, added, modified), [meta]
         * meta = deleted -> []
         * meta = added -> [face ids]
         * meta = modified -> [[face id, newId (0=removed, any other=new)]]
         * connected components do not have to have their faces sorted.
         *
         * Caution: it might already exist.
         */
        let updates = chunk.updates;
        TopoKernel.rawUpdateAfterAddition(chunk, id, x, y, z, updates);

        if (TopoKernel.detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z)) {
            TopoKernel.divideConnectedComponents(chunk, id, x, y, z, updates);
        }
    }

    static rawUpdateAfterAddition(chunk, id, x, y, z, updates) {
        const updatesNotEmpty = (CollectionUtils.numberOfProperties(updates) > 0);
        // TODO Compute new surface faces and remove old ones.
        // TODO if chunk was updated after the last IO call, stack modifications in the chunk update variable.
    }

    static divideConnectedComponents(chunk, id, x, y, z, updates) {
        const updatesNotEmpty = (CollectionUtils.numberOfProperties(updates) > 0);
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

    static updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z) {
        let updates = chunk.updates;
        TopoKernel.rawUpdateAfterDeletion(chunk, id, x, y, z, updates);
        if (TopoKernel.detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z)) {
            TopoKernel.mergeComponents(chunk, id, x, y, z, updates);
        }
    }

    static rawUpdateAfterDeletion(chunk, id, x, y, z, updates) {
        // TODO delete.
    }

    static detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z) {
        // Criterion: pre-existing faces belonged to separate connected components.
        // TODO deletion version (easier)
    }

    static mergeComponents(chunk, id, x, y, z, updates) {
        // TODO deletion version (easier)
    }

}

export default TopoKernel;
