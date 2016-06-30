/**
 *
 */

'use strict';

import CollectionUtils from '../../../../math/collections/util';

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
                (y<0 || chunk.contains(x-1, y-1, z)) && (y>dimensions[1] || chunk.contains(x-1, y+1, z)) &&
                (z<0 || chunk.contains(x-1, y, z-1)) && (z>dimensions[2] || chunk.contains(x-1, y, z+1)) &&
                (x-2<0 || chunk.contains(x-2, y, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x-1, y, z);
        }
        if (x < dimensions[0] && chunk.contains(x+1, y, z)) {
            xp = true;
            if (
                (y<0 || chunk.contains(x+1, y-1, z)) && (y>dimensions[1] || chunk.contains(x+1, y+1, z)) &&
                (z<0 || chunk.contains(x+1, y, z-1)) && (z>dimensions[2] || chunk.contains(x+1, y, z+1)) &&
                (x+2>dimensions[0] || chunk.contains(x+2, y, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x+1, y, z);
        }

        // Update (y+1, y-1) blocks.
        if (y > 0 && chunk.contains(x, y-1, z)) {
            ym = true;
            if (
                (x<0 || chunk.contains(x-1, y-1, z)) && (x>dimensions[0] || chunk.contains(x+1, y-1, z)) &&
                (z<0 || chunk.contains(x, y-1, z-1)) && (z>dimensions[2] || chunk.contains(x, y-1, z+1)) &&
                (y-2<0 || chunk.contains(x, y-2, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y-1, z);
        }
        if (y < dimensions[1] && chunk.contains(x, y+1, z)) {
            yp = true;
            if (
                (x<0 || chunk.contains(x-1, y+1, z)) && (x>dimensions[0] || chunk.contains(x+1, y+1, z)) &&
                (z<0 || chunk.contains(x, y+1, z-1)) && (z>dimensions[2] || chunk.contains(x, y, z+1)) &&
                (y+2>dimensions[1] || chunk.contains(x, y+2, z))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y+1, z);
        }

        // Update (z-1, z+1) blocks.
        if (z > 0 && chunk.contains(x, y, z-1)) {
            zm = true;
            if (
                (x<0 || chunk.contains(x-1, y, z-1)) && (x>dimensions[0] || chunk.contains(x+1, y, z-1)) &&
                (y<0 || chunk.contains(x, y-1, z-1)) && (y>dimensions[1] || chunk.contains(x, y+1, z-1)) &&
                (z-2<0 || chunk.contains(x, y, z-2))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z-1);
        }
        if (z < dimensions[2] && chunk.contains(x, y, z+1)) {
            zp = true;
            if (
                (x<0 || chunk.contains(x-1, y, z+1)) && (x>dimensions[0] || chunk.contains(x+1, y, z+1)) &&
                (z<0 || chunk.contains(x, y-1, z+1)) && (y>dimensions[1] || chunk.contains(x, y+1, z+1)) &&
                (z+2>dimensions[2] || chunk.contains(x, y, z+2))
            ) TopoKernel.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z+1);
        }

        // Update current block.
        if (!(xm && ym && xp && yp && zm && zp)) TopoKernel.addSurfaceBlock(surfaceBlocks, chunk, x, y, z);
    }

    static detectTopologyChangeAfterAddition(chunk, id, x, y, z) {
        // TODO
        // Criterion: at least 2 surface faces that do not link on the inserted cube.
    }

    // The difficulty is to determine which surface faces belong to which component after aan addition.
    static divideAfterAddition(chunk, id, x, y, z) {
        if (!detectTopologyChangeAfterAddition(chunk, id, x, y, z)) return;

        let blocks = chunk.blocks;
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        // TODO
    }

    static updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z) {

    }

    static detectTopologyChangeAfterDeletion(chunk, id, x, y, z) {
        // TODO
        // Criterion: at least 2 surface faces that DID not link on the cube to be removed.
    }

    static mergeAfterDeletion(chunk, id, x, y, z) {
        if (!detectTopologyChangeAfterDeletion(chunk, id, x, y, z)) return;
    }

}

export default TopoKernel;
