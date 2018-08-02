/**
 *
 */

'use strict';

import CollectionUtils from '../../../math/collections';
import ChunkBuilder from '../../engine_consistency/builder/builder_chunks';

class UpdaterBlock {

    static removeSurfaceBlock(surfaceBlocks, chunk, x, y, z) {
        surfaceBlocks[z].splice(surfaceBlocks[z].indexOf(chunk._toId(x, y, z)));
    }

    static addSurfaceBlock(surfaceBlocks, chunk, x, y, z) {
        const id = chunk._toId(x, y, z);
        if (!surfaceBlocks.hasOwnProperty(z)) surfaceBlocks[z] = [id];
        else CollectionUtils.insert(id, surfaceBlocks[z]);
    }

    // The difficulty is to keep layered surfaceBlocks sorted.
    // TODO [HIGH] I am quite sure this does not work at all for neighbour chunks.
    static updateSurfaceBlocksAfterAddition(chunk, id, x, y, z)
    {
        let surfaceBlocks = chunk.surfaceBlocks;
        let dimensions = chunk.dimensions;
        let xp = false;
        let xm = false;
        let yp = false;
        let ym = false;
        let zp = false;
        let zm = false;

        // TODO [LOW] compute surface changes on neighbours

        // Update (x+1, x-1) blocks.
        if (x > 0) {
            if (chunk.contains(x - 1, y, z)) {
                xm = true;
                if ((y - 1 < 0 || chunk.contains(x - 1, y - 1, z)) &&
                    (y + 1 > dimensions[1] || chunk.contains(x - 1, y + 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x - 1, y, z - 1)) &&
                    (z + 1 > dimensions[2] || chunk.contains(x - 1, y, z + 1)) &&
                    (x - 2 < 0 || chunk.contains(x - 2, y, z)))
                    UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x - 1, y, z);
            }
        }

        if (x + 1 < dimensions[0]) {
            if (chunk.contains(x + 1, y, z)) {
                xp = true;
                if ((y - 1 < 0 || chunk.contains(x + 1, y - 1, z)) &&
                    (y + 1 > dimensions[1] || chunk.contains(x + 1, y + 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x + 1, y, z - 1)) &&
                    (z + 1 > dimensions[2] || chunk.contains(x + 1, y, z + 1)) &&
                    (x + 2 > dimensions[0] || chunk.contains(x + 2, y, z)))
                    UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x + 1, y, z);
            }
        }

        // Update (y+1, y-1) blocks.
        if (y > 0) {
            if (chunk.contains(x, y - 1, z)) {
                ym = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y - 1, z)) &&
                    (x + 1 > dimensions[0] || chunk.contains(x + 1, y - 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x, y - 1, z - 1)) &&
                    (z + 1 > dimensions[2] || chunk.contains(x, y - 1, z + 1)) &&
                    (y - 2 < 0 || chunk.contains(x, y - 2, z)))
                    UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y - 1, z);
            }
        }
        if (y + 1 < dimensions[1]) {
            if (chunk.contains(x, y + 1, z)) {
                yp = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y + 1, z)) &&
                    (x + 1 > dimensions[0] || chunk.contains(x + 1, y + 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x, y + 1, z - 1)) &&
                    (z + 1 > dimensions[2] || chunk.contains(x, y, z + 1)) &&
                    (y + 2 > dimensions[1] || chunk.contains(x, y + 2, z)))
                    UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y + 1, z);
            }
        }

        // Update (z-1, z+1) blocks.
        if (z > 0) {
            if (chunk.contains(x, y, z - 1)) {
                zm = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y, z - 1)) &&
                    (x + 1 > dimensions[0] || chunk.contains(x + 1, y, z - 1)) &&
                    (y - 1 < 0 || chunk.contains(x, y - 1, z - 1)) &&
                    (y + 1 > dimensions[1] || chunk.contains(x, y + 1, z - 1)) &&
                    (z - 2 < 0 || chunk.contains(x, y, z - 2)))
                    UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z - 1);
            }
        }
        if (z + 1 < dimensions[2]) {
            if (chunk.contains(x, y, z + 1)) {
                zp = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y, z + 1)) &&
                    (x + 1 > dimensions[0] || chunk.contains(x + 1, y, z + 1)) &&
                    (y - 1 < 0 || chunk.contains(x, y - 1, z + 1)) &&
                    (y + 1 > dimensions[1] || chunk.contains(x, y + 1, z + 1)) &&
                    (z + 2 > dimensions[2] || chunk.contains(x, y, z + 2)))
                    UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z + 1);
            }
        }

        // Update current block.
        if (!(xm && ym && xp && yp && zm && zp)) UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z);
    }

    // BLOCK DELETION
    static updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z)
    {
        // Get all neighbour chunks.
        let neighbourChunks = [];
        let neighbourBlocks = [];
        const numberOfNeighbours = 6;
        for (let i = 0; i < numberOfNeighbours; ++i) {
            let tempChunk = ChunkBuilder.getNeighboringChunk(chunk, i);
            if (tempChunk) {
                neighbourChunks.push(tempChunk);
                neighbourBlocks.push(tempChunk.blocks);
            } else {
                console.log('Error: could not get neighboting chunk at UpdaterBlocks.');
            }
        }

        let surfaceBlocks = chunk.surfaceBlocks;
        let dimensions = chunk.dimensions;
        let xp = false;
        let xm = false;
        let yp = false;
        let ym = false;
        let zp = false;
        let zm = false;

        if (x + 1 === dimensions[0])
            UpdaterBlock.addSurfaceBlock(neighbourChunks[0].surfaceBlocks, neighbourChunks[0], 0, y, z);
        if (x - 1 < 0)
            UpdaterBlock.addSurfaceBlock(neighbourChunks[1].surfaceBlocks, neighbourChunks[1], dimensions[0] - 1, y, z);
        if (y + 1 === dimensions[1])
            UpdaterBlock.addSurfaceBlock(neighbourChunks[2].surfaceBlocks, neighbourChunks[2], x, 0, z);
        if (y - 1 < 0)
            UpdaterBlock.addSurfaceBlock(neighbourChunks[3].surfaceBlocks, neighbourChunks[3], x, dimensions[1] - 1, z);
        if (z + 1 === dimensions[2])
            UpdaterBlock.addSurfaceBlock(neighbourChunks[4].surfaceBlocks, neighbourChunks[4], x, y, 0);
        if (z - 1 < 0)
            UpdaterBlock.addSurfaceBlock(neighbourChunks[5].surfaceBlocks, neighbourChunks[5], x, y, dimensions[2] - 1);

        // Update (x+1, x-1) blocks.
        if (x > 0) {
            if (chunk.contains(x - 1, y, z)) {
                xm = true;
                if ((y - 1 < 0 || chunk.contains(x - 1, y - 1, z)) &&
                    (y + 1 >= dimensions[1] || chunk.contains(x - 1, y + 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x - 1, y, z - 1)) &&
                    (z + 1 >= dimensions[2] || chunk.contains(x - 1, y, z + 1)) &&
                    (x - 2 < 0 || chunk.contains(x - 2, y, z)))
                    UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x - 1, y, z);
            }
        }
        if (x + 1 < dimensions[0]) {
            if (chunk.contains(x + 1, y, z)) {
                xp = true;
                if ((y - 1 < 0 || chunk.contains(x + 1, y - 1, z)) &&
                    (y + 1 >= dimensions[1] || chunk.contains(x + 1, y + 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x + 1, y, z - 1)) &&
                    (z + 1 >= dimensions[2] || chunk.contains(x + 1, y, z + 1)) &&
                    (x + 2 >= dimensions[0] || chunk.contains(x + 2, y, z)))
                    UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x + 1, y, z);
            }
        }

        // Update (y+1, y-1) blocks.
        if (y > 0) {
            if (chunk.contains(x, y - 1, z)) {
                ym = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y - 1, z)) &&
                    (x + 1 >= dimensions[0] || chunk.contains(x + 1, y - 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x, y - 1, z - 1)) &&
                    (z + 1 >= dimensions[2] || chunk.contains(x, y - 1, z + 1)) &&
                    (y - 2 < 0 || chunk.contains(x, y - 2, z)))
                    UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y - 1, z);
            }
        }
        if (y + 1 < dimensions[1]) {
            if (chunk.contains(x, y + 1, z)) {
                yp = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y + 1, z)) &&
                    (x + 1 >= dimensions[0] || chunk.contains(x + 1, y + 1, z)) &&
                    (z - 1 < 0 || chunk.contains(x, y + 1, z - 1)) &&
                    (z + 1 >= dimensions[2] || chunk.contains(x, y + 1, z + 1)) &&
                    (y + 2 >= dimensions[1] || chunk.contains(x, y + 2, z)))
                    UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y + 1, z);
            }
        }

        // Update (z-1, z+1) blocks.
        if (z > 0) {
            if (chunk.contains(x, y, z - 1)) {
                zm = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y, z - 1)) &&
                    (x + 1 >= dimensions[0] || chunk.contains(x + 1, y, z - 1)) &&
                    (y - 1 < 0 || chunk.contains(x, y - 1, z - 1)) &&
                    (y + 1 >= dimensions[1] || chunk.contains(x, y + 1, z - 1)) &&
                    (z - 2 < 0 || chunk.contains(x, y, z - 2)))
                    UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z - 1);
            }
        }
        if (z + 1 < dimensions[2]) {
            if (chunk.contains(x, y, z + 1)) {
                zp = true;
                if ((x - 1 < 0 || chunk.contains(x - 1, y, z + 1)) &&
                    (x + 1 >= dimensions[0] || chunk.contains(x + 1, y, z + 1)) &&
                    (y - 1 < 0 || chunk.contains(x, y - 1, z + 1)) &&
                    (y + 1 >= dimensions[1] || chunk.contains(x, y + 1, z + 1)) &&
                    (z + 2 >= dimensions[2] || chunk.contains(x, y, z + 2)))
                    UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z + 1);
            }
        }

        // Update current block.
        if (!(xm && ym && xp && yp && zm && zp)) // Was the current block a surface block?
            UpdaterBlock.removeSurfaceBlock(surfaceBlocks, chunk, x, y, z);
    }

}

export default UpdaterBlock;
