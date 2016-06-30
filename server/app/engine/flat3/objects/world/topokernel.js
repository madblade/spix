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
    static divideAfterAddition(chunk, id, x, y, z) {
        if (!detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z)) return;

        let blocks = chunk.blocks;
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        // TODO
    }

    static updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z) {

    }

    static detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z) {
        // Criterion: pre-existing faces belonged to separate connected components.
        // TODO
    }

    static mergeAfterDeletion(chunk, id, x, y, z) {
        if (!detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z)) return;
    }

}

export default TopoKernel;
