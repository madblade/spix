/**
 *
 */

'use strict';

import CollectionUtils from '../../../math/collections';
import ChunkBuilder from '../../engine_consistency/builder/builder_chunks';
import { BlockType } from '../../model_world/model';

class UpdaterBlock
{
    static removeSurfaceBlock(surfaceBlocks, chunk, x, y, z)
    {
        surfaceBlocks[z].splice(surfaceBlocks[z].indexOf(chunk._toId(x, y, z)));
    }

    static addSurfaceBlock(surfaceBlocks, chunk, x, y, z)
    {
        const id = chunk._toId(x, y, z);
        if (!surfaceBlocks.hasOwnProperty(z)) surfaceBlocks[z] = [id];
        else CollectionUtils.insert(id, surfaceBlocks[z]);
    }

    static processNeighbourSurfaceBlockAfterAddition(
        chunk, airBlock, waterBlock, isAddedBlockWater,
        xs, ys, zs,
    )
    {
        let changed = false;
        let neighbourBlock = chunk.queryBlock(xs[0], ys[0], zs[0]);
        if (neighbourBlock !== airBlock &&
            neighbourBlock === waterBlock === isAddedBlockWater // (N.B. eval from left to right)
        )
        {
            changed = true;
            let a = chunk.queryBlock(xs[1], ys[1], zs[1]);
            let b = chunk.queryBlock(xs[2], ys[2], zs[2]);
            let c = chunk.queryBlock(xs[3], ys[3], zs[3]);
            let d = chunk.queryBlock(xs[4], ys[4], zs[4]);
            let e = chunk.queryBlock(xs[5], ys[5], zs[5]);
            let notSurface;
            if (neighbourBlock === waterBlock) {
                notSurface =
                    a !== waterBlock || b !== waterBlock ||
                    c !== waterBlock || d !== waterBlock || e !== waterBlock;
            } else {
                notSurface =
                    a === waterBlock || a === airBlock || b === waterBlock || b === waterBlock ||
                    c === waterBlock || c === airBlock || d === waterBlock || d === airBlock ||
                    e === waterBlock || e === airBlock;
            }

            if (notSurface) {
                let ch = chunk.queryChunk(xs[0], ys[0], zs[0]);
                UpdaterBlock.removeSurfaceBlock(ch[0].surfaceBlocks, ch[0], ch[1], ch[2], ch[3]);
            }
        }
        return changed;
    }

    // The difficulty is to keep layered surfaceBlocks sorted.
    static updateSurfaceBlocksAfterAddition(
        chunk, id, x, y, z, blockId)
    {
        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;
        let isAddedBlockWater = blockId === waterBlock;

        let surfaceBlocks = chunk.surfaceBlocks;
        let xm; let ym; let zm;
        let xp; let yp; let zp;

        // x+ and x-
        xm = UpdaterBlock.processNeighbourSurfaceBlockAfterAddition(
            chunk, airBlock, waterBlock, isAddedBlockWater,
            [x - 1, x - 1, x - 1, x - 1, x - 1, x - 2],
            [y, y - 1, y + 1, y, y, y],
            [z, z, z, z - 1, z + 1, z]
        );
        xp = UpdaterBlock.processNeighbourSurfaceBlockAfterAddition(
            chunk, airBlock, waterBlock, isAddedBlockWater,
            [x + 1, x + 1, x + 1, x + 1, x + 1, x + 2],
            [y, y - 1, y + 1, y, y, y],
            [z, z, z, z - 1, z + 1, z]
        );

        // Update (y+1, y-1) blocks.
        ym = UpdaterBlock.processNeighbourSurfaceBlockAfterAddition(
            chunk, airBlock, waterBlock, isAddedBlockWater,
            [x, x - 1, x + 1, x, x, x],
            [y - 1, y - 1, y - 1, y - 1, y - 1, y - 2],
            [z, z, z, z - 1, z + 1, z]
        );
        yp = UpdaterBlock.processNeighbourSurfaceBlockAfterAddition(
            chunk, airBlock, waterBlock, isAddedBlockWater,
            [x, x - 1, x + 1, x, x, x],
            [y + 1, y + 1, y + 1, y + 1, y + 1, y + 2],
            [z, z, z, z - 1, z + 1, z]
        );

        // Update (z-1, z+1) blocks.
        zm = UpdaterBlock.processNeighbourSurfaceBlockAfterAddition(
            chunk, airBlock, waterBlock, isAddedBlockWater,
            [x, x - 1, x + 1, x, x, x],
            [y, y, y, y - 1, y + 1, y],
            [z - 1, z - 1, z - 1, z - 1, z - 1, z - 2]
        );
        zp = UpdaterBlock.processNeighbourSurfaceBlockAfterAddition(
            chunk, airBlock, waterBlock, isAddedBlockWater,
            [x, x - 1, x + 1, x, x, x],
            [y, y, y, y - 1, y + 1, y],
            [z + 1, z + 1, z + 1, z + 1, z + 1, z + 2]
        );

        // Update current block.
        if (!(xm && ym && xp && yp && zm && zp)) {
            UpdaterBlock.addSurfaceBlock(surfaceBlocks, chunk, x, y, z);
        }
    }

    // BLOCK DELETION
    // Simpler! A deletion is just adding an air block,
    // so all neighbours become surface blocks.
    static updateSurfaceBlocksAfterDeletion(chunk, id, x, y, z)
    {
        // Get all neighbour chunks.
        let neighbourChunks = [];
        // let neighbourBlocks = [];
        const numberOfNeighbours = 6;
        for (let i = 0; i < numberOfNeighbours; ++i) {
            let tempChunk = ChunkBuilder.getNeighboringChunk(chunk, i);
            if (tempChunk) {
                neighbourChunks.push(tempChunk);
                // neighbourBlocks.push(tempChunk.blocks);
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

        // Can’t add a non-surface block.
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
        if (x > 0)
        {
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
        if (x + 1 < dimensions[0])
        {
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
        if (y > 0)
        {
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
        if (y + 1 < dimensions[1])
        {
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
        if (z > 0)
        {
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
        if (z + 1 < dimensions[2])
        {
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
