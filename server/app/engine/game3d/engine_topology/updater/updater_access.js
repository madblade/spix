/**
 *
 */

'use strict';

import NumberUtils from '../../../math/numbers';

class UpdaterAccess {

    static debug = false;

    static getChunkAndLocalCoordinates(chunkI, chunkJ, chunkK, isBoundaryX, isBoundaryY, isBoundaryZ,
                                       floors, mustBeEmpty, world, blockCoordinatesOnChunk)
    {
        const starterChunkId = chunkI + ',' + chunkJ + ',' + chunkK;

        const fx = floors[0];
        const fy = floors[1];
        const fz = floors[2];

        const dimX = world.xSize, dimY = world.ySize, dimZ = world.zSize;
        let allChunks = world.allChunks;

        blockCoordinatesOnChunk[0] = (fx >= 0 ? fx : dimX-((-fx)%dimX)) % dimX;
        blockCoordinatesOnChunk[1] = (fy >= 0 ? fy : dimY-((-fy)%dimY)) % dimY;
        blockCoordinatesOnChunk[2] = (fz >= 0 ? fz : dimZ-((-fz)%dimZ)) % dimZ;
        if (UpdaterAccess.debug) console.log(blockCoordinatesOnChunk);

        let chunk = world.allChunks.get(starterChunkId);
        if (!isBoundaryX && !isBoundaryY && !isBoundaryZ) {
            return chunk;
        }

        if (mustBeEmpty ===
            (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) === 0))
        {
            return chunk;
        }

        // TODO can it be boundary to several chunks at the same time?
        // If request -> nope (requests aint done on edges for security purposes)

        if (UpdaterAccess.debug) console.log(starterChunkId);
        if (isBoundaryX) {
            blockCoordinatesOnChunk[0] = dimX-1;
            const rightChunkId = (chunkI-1) + ',' + chunkJ + ',' + chunkK;
            return allChunks.get(rightChunkId);
        }

        if (isBoundaryY) {
            blockCoordinatesOnChunk[1] = dimY-1;
            const rightChunkId = chunkI + ',' + (chunkJ-1) + ',' + chunkK;
            return allChunks.get(rightChunkId);
        }

        if (isBoundaryZ) {
            blockCoordinatesOnChunk[2] = dimZ-1;
            const rightChunkId = chunkI + ',' + chunkJ + ',' + (chunkK-1);
            return allChunks.get(rightChunkId);
        }
    }

    static addBlock(originEntity, x, y, z, blockId, world, entityModel, accessor)
    {
        let worldId = world.worldId;
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coords = accessor.getChunkCoordinatesFromFloatingPoint(worldId, x, y, z, floors[0], floors[1], floors[2]);

        const i = coords[0], j = coords[1], k = coords[2];

        const isBoundaryX = coords[3];
        const isBoundaryY = coords[4];
        const isBoundaryZ = coords[5];

        let blockCoordinatesOnChunk = [];
        let chunk = UpdaterAccess.getChunkAndLocalCoordinates(i, j, k, isBoundaryX, isBoundaryY, isBoundaryZ,
            floors, true, world, blockCoordinatesOnChunk);

        if (UpdaterAccess.debug) console.log("Transaction required on " + chunk.chunkId);
        if (!chunk || chunk === undefined || !chunk.ready)
        {
            console.log('Could not find chunk ' + chunk.chunkId);
            return;
        }

        // Validate request.
        if (!UpdaterAccess.translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk,
                blockCoordinatesOnChunk, entityModel, isBoundaryX, isBoundaryY, isBoundaryZ))
        {
            return;
        }

        // Add block on chunk.
        //chunk.add(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2], blockId);
        return [chunk, blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2], blockId];
    }

    static delBlock(originEntity, x, y, z, world, entityModel, accessor)
    {
        let worldId = world.worldId;
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coords = accessor.getChunkCoordinatesFromFloatingPoint(worldId, x, y, z, floors[0], floors[1], floors[2]);

        const i = coords[0], j = coords[1], k = coords[2];

        const isBoundaryX = coords[3];
        const isBoundaryY = coords[4];
        const isBoundaryZ = coords[5];

        let blockCoordinatesOnChunk = [];
        let chunk = UpdaterAccess.getChunkAndLocalCoordinates(i, j, k, isBoundaryX, isBoundaryY, isBoundaryZ,
            floors, false, world, blockCoordinatesOnChunk);

        if (UpdaterAccess.debug) console.log("Transaction required on " + chunk.chunkId);
        if (!chunk || chunk === undefined || !chunk.ready)
        {
            console.log('Could not find chunk ' + chunk.chunkId);
            return;
        }

        // Validate request.
        if (!UpdaterAccess.translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk,
                blockCoordinatesOnChunk, entityModel, isBoundaryX, isBoundaryY, isBoundaryZ))
        {
            return;
        }

        // Add block on chunk.
        return [chunk, blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]];
    }

    static distance3(v1, v2) {
        let x = v1[0]-v2[0]; x*=x;
        let y = v1[1]-v2[1]; y*=y;
        let z = v1[2]-v2[2]; z*=z;
        return Math.sqrt(x+y+z);
    }

    static validateBlockEdition(originEntity, x, y, z, floors) {
        let fx = floors[0]; let fy = floors[1]; let fz = floors[2];
        // 4 blocks maximum range for block editing.
        const d3 = UpdaterAccess.distance3(originEntity.position, [fx+.5, fy+.5, fz+.5]);
        return (d3 < 10);
    }

    static translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk,
                                             entityModel, isBoundaryX, isBoundaryY, isBoundaryZ)
    {
        function failure(reason) { console.log("Request denied: " + reason); }

        if (!UpdaterAccess.validateBlockEdition(originEntity, x, y, z, floors))
        {
            failure("distance not validated by world manager.");
            return false;
        }

        // One cannot add a floating block.
        const dx = Math.abs(Math.abs(x) - Math.abs(floors[0]));
        const dy = Math.abs(Math.abs(y) - Math.abs(floors[1]));
        const dz = Math.abs(Math.abs(z) - Math.abs(floors[2]));

        const lx = blockCoordinatesOnChunk[0]; // l stands for local
        const ly = blockCoordinatesOnChunk[1];
        const lz = blockCoordinatesOnChunk[2];

        let epsilon = NumberUtils.isEpsilon;
        if (epsilon(dx) && !epsilon(dy) && !epsilon(dz)) {
            // Which side of the face is empty...
            if (!isBoundaryX) {
                if (chunk.what(lx-1, ly, lz) === 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;
            } else {
            //    if (chunk.what(lx, ly, lz) !== 0) blockCoordinatesOnChunk[0] = lx === 0 ? chunk.dimensions[0]-1 : 0;
            }

        } else if (!epsilon(dx) && epsilon(dy) && !epsilon(dz)) {
            if (!isBoundaryY) {
                if (chunk.what(lx, ly-1, lz) === 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;
            }

        } else if (!epsilon(dx) && !epsilon(dy) && epsilon(dz)) {
            if (!isBoundaryZ) {
                if (chunk.what(lx, ly, lz-1) === 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;
            }

            // On-edge request.
        } else {
            failure("precision (on-edge request).");
            return false;
        }

        if (UpdaterAccess.debug) console.log(blockCoordinatesOnChunk);

        // Designed block must be 0.
        if (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) !== 0)
        {
            failure("block is not empty.");
            return false;
        }

        // Detect OOB.
        if (blockCoordinatesOnChunk[0] < 0 || blockCoordinatesOnChunk[0] >= chunk.dimensions[0] ||
            blockCoordinatesOnChunk[1] < 0 || blockCoordinatesOnChunk[1] >= chunk.dimensions[1] ||
            blockCoordinatesOnChunk[2] < 0 || blockCoordinatesOnChunk[2] >= chunk.dimensions[2])
        {
            failure("block is OOB for its relative chunk.");
            return false;
        }

        // Detect entities.
        // TODO [HIGH] simplify, correct.
        // TODO [MEDIUM] directly compute block x,y,z client-side.
        if (entityModel.anEntityIsPresentOn(floors[0], floors[1], floors[2]))
        {
            failure("an entity is present on the block.");
            return false;
        }

        return true;
    }

    // TODO [HIGH] determine it client-side, work it with topology engine.
    static translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk,
                                             entityModel, isBoundaryX, isBoundaryY, isBoundaryZ)
    {
        function failure(reason) { console.log("Request denied: " + reason); }

        if (!UpdaterAccess.validateBlockEdition(originEntity, x, y, z, floors))
        {
            failure("distance not validated by world manager.");
            return false;
        }

        const dx = Math.abs(Math.abs(x) - Math.abs(floors[0]));
        const dy = Math.abs(Math.abs(y) - Math.abs(floors[1]));
        const dz = Math.abs(Math.abs(z) - Math.abs(floors[2]));

        const lx = blockCoordinatesOnChunk[0]; // l stands for local
        const ly = blockCoordinatesOnChunk[1];
        const lz = blockCoordinatesOnChunk[2];

        let epsilon = NumberUtils.isEpsilon;
        if (epsilon(dx) && !epsilon(dy) && !epsilon(dz)) {
            if (!isBoundaryX) {
                if (chunk.what(lx-1, ly, lz) !== 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;
            }

        } else if (!epsilon(dx) && epsilon(dy) && !epsilon(dz)) {
            if (!isBoundaryY) {
                if (chunk.what(lx, ly-1, lz) !== 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;
            }

        } else if (!epsilon(dx) && !epsilon(dy) && epsilon(dz)) {
            if (!isBoundaryZ) {
                if (chunk.what(lx, ly, lz-1) !== 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;
            }

            // On-edge request.
        } else {
            failure("precision (on-edge request).");
            return false;
        }

        if (UpdaterAccess.debug) console.log(blockCoordinatesOnChunk);

        // Designed block must be 0.
        if (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) === 0)
        {
            failure("block is already empty.");
            return false;
        }

        // Detect OOB.
        if (blockCoordinatesOnChunk[0] < 0 || blockCoordinatesOnChunk[0] >= chunk.dimensions[0] ||
            blockCoordinatesOnChunk[1] < 0 || blockCoordinatesOnChunk[1] >= chunk.dimensions[1] ||
            blockCoordinatesOnChunk[2] < 0 || blockCoordinatesOnChunk[2] >= chunk.dimensions[2])
        {
            failure("block is OOB for its relative chunk.");
            return false;
        }

        // Validate update.
        /*if (entityModel.anEntityIsPresentOn(floors[0], floors[1], floors[2]))
        {
            failure("an entity is present on the block.");
            return false;
        }*/

        return true;
    }

}

export default UpdaterAccess;
