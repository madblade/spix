/**
 *
 */

'use strict';

class UpdateAPI {

    static debug = false;

    static isEpsilon(strictlyPositiveNumber) {
        return (strictlyPositiveNumber < 0.000001);
    }

    static getChunkAndLocalCoordinates(chunkI, chunkJ, chunkK, isBoundaryX, isBoundaryY, isBoundaryZ,
                                       floors, mustBeEmpty, worldManager, blockCoordinatesOnChunk)
    {
        const starterChunkId = chunkI + ',' + chunkJ + ',' + chunkK;

        const fx = floors[0];
        const fy = floors[1];
        const fz = floors[2];

        const dimX = worldManager.chunkDimensionX;
        const dimY = worldManager.chunkDimensionY;
        const dimZ = worldManager.chunkDimensionZ;

        blockCoordinatesOnChunk[0] = (fx >= 0 ? fx : dimX-((-fx)%dimX)) % dimX;
        blockCoordinatesOnChunk[1] = (fy >= 0 ? fy : dimY-((-fy)%dimY)) % dimY;
        blockCoordinatesOnChunk[2] = (fz >= 0 ? fz : dimZ-((-fz)%dimZ)) % dimZ;
        if (UpdateAPI.debug) console.log(blockCoordinatesOnChunk);

        let chunk = worldManager.allChunks.get(starterChunkId);
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

        if (UpdateAPI.debug) console.log(starterChunkId);
        if (isBoundaryX) {
            blockCoordinatesOnChunk[0] = dimX-1;
            const rightChunkId = (chunkI-1) + ',' + chunkJ + ',' + chunkK;
            return worldManager.allChunks.get(rightChunkId);
        }

        if (isBoundaryY) {
            blockCoordinatesOnChunk[1] = dimY-1;
            const rightChunkId = chunkI + ',' + (chunkJ-1) + ',' + chunkK;
            return worldManager.allChunks.get(rightChunkId);
        }

        if (isBoundaryZ) {
            blockCoordinatesOnChunk[2] = dimZ-1;
            const rightChunkId = chunkI + ',' + chunkJ + ',' + (chunkK-1);
            return worldManager.allChunks.get(rightChunkId);
        }
    }

    static addBlock(originEntity, x, y, z, blockId, worldManager, entityManager)
    {
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = worldManager.getChunkCoordinatesFromFloatingPoint(x, y, z, floors[0], floors[1], floors[2]);

        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];

        const isBoundaryX = coordinates[3];
        const isBoundaryY = coordinates[4];
        const isBoundaryZ = coordinates[5];

        let blockCoordinatesOnChunk = [];
        let chunk = UpdateAPI.getChunkAndLocalCoordinates(i, j, k, isBoundaryX, isBoundaryY, isBoundaryZ,
            floors, true, worldManager, blockCoordinatesOnChunk);

        if (UpdateAPI.debug) console.log("Transaction required on " + chunk.chunkId);
        if (!chunk || chunk === undefined || !chunk.ready)
        {
            console.log('Could not find chunk ' + chunk.chunkId);
            return;
        }

        // Validate request.
        if (!UpdateAPI.translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk,
                blockCoordinatesOnChunk, entityManager, isBoundaryX, isBoundaryY, isBoundaryZ))
        {
            return;
        }

        // Add block on chunk.
        chunk.add(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2], blockId);

        // Remember this chunk was touched.
        worldManager.chunkUpdated(chunk.chunkId);
    }

    static delBlock(originEntity, x, y, z, worldManager, entityManager)
    {
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = worldManager.getChunkCoordinatesFromFloatingPoint(x, y, z, floors[0], floors[1], floors[2]);

        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];

        const isBoundaryX = coordinates[3];
        const isBoundaryY = coordinates[4];
        const isBoundaryZ = coordinates[5];

        let blockCoordinatesOnChunk = [];
        let chunk = UpdateAPI.getChunkAndLocalCoordinates(i, j, k, isBoundaryX, isBoundaryY, isBoundaryZ,
            floors, false, worldManager, blockCoordinatesOnChunk);

        if (UpdateAPI.debug) console.log("Transaction required on " + chunk.chunkId);
        if (!chunk || chunk === undefined || !chunk.ready)
        {
            console.log('Could not find chunk ' + chunk.chunkId);
            return;
        }

        // Validate request.
        if (!UpdateAPI.translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk,
                blockCoordinatesOnChunk, entityManager, isBoundaryX, isBoundaryY, isBoundaryZ))
        {
            return;
        }

        // Add block on chunk.
        chunk.del(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]);

        // Remember this chunk was touched.
        worldManager.chunkUpdated(chunk.chunkId);
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
        const d3 = UpdateAPI.distance3(originEntity.position, [fx+.5, fy+.5, fz+.5]);
        return (d3 < 10);
    }

    static translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk,
                                             entityManager, isBoundaryX, isBoundaryY, isBoundaryZ)
    {
        function failure(reason) { console.log("Request denied: " + reason); }

        if (!UpdateAPI.validateBlockEdition(originEntity, x, y, z, floors))
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

        if (UpdateAPI.isEpsilon(dx) && !UpdateAPI.isEpsilon(dy) && !UpdateAPI.isEpsilon(dz)) {
            // Which side of the face is empty...
            if (!isBoundaryX) {
                if (chunk.what(lx-1, ly, lz) === 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;
            } else {
            //    if (chunk.what(lx, ly, lz) !== 0) blockCoordinatesOnChunk[0] = lx === 0 ? chunk.dimensions[0]-1 : 0;
            }

        } else if (!UpdateAPI.isEpsilon(dx) && UpdateAPI.isEpsilon(dy) && !UpdateAPI.isEpsilon(dz)) {
            if (!isBoundaryY) {
                if (chunk.what(lx, ly-1, lz) === 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;
            }

        } else if (!UpdateAPI.isEpsilon(dx) && !UpdateAPI.isEpsilon(dy) && UpdateAPI.isEpsilon(dz)) {
            if (!isBoundaryZ) {
                if (chunk.what(lx, ly, lz-1) === 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;
            }

            // On-edge request.
        } else {
            failure("precision (on-edge request).");
            return false;
        }

        if (UpdateAPI.debug) console.log(blockCoordinatesOnChunk);

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
        if (entityManager.anEntityIsPresentOn(floors[0], floors[1], floors[2]))
        {
            failure("an entity is present on the block.");
            return false;
        }

        return true;
    }

    static translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk,
                                             entityManager, isBoundaryX, isBoundaryY, isBoundaryZ)
    {
        function failure(reason) { console.log("Request denied: " + reason); }

        if (!UpdateAPI.validateBlockEdition(originEntity, x, y, z, floors))
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

        if (UpdateAPI.isEpsilon(dx) && !UpdateAPI.isEpsilon(dy) && !UpdateAPI.isEpsilon(dz)) {
            if (!isBoundaryX) {
                if (chunk.what(lx-1, ly, lz) !== 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;
            }

        } else if (!UpdateAPI.isEpsilon(dx) && UpdateAPI.isEpsilon(dy) && !UpdateAPI.isEpsilon(dz)) {
            if (!isBoundaryY) {
                if (chunk.what(lx, ly-1, lz) !== 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;
            }

        } else if (!UpdateAPI.isEpsilon(dx) && !UpdateAPI.isEpsilon(dy) && UpdateAPI.isEpsilon(dz)) {
            if (!isBoundaryZ) {
                if (chunk.what(lx, ly, lz-1) !== 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;
            }

            // On-edge request.
        } else {
            failure("precision (on-edge request).");
            return false;
        }

        if (UpdateAPI.debug) console.log(blockCoordinatesOnChunk);

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
        /*if (entityManager.anEntityIsPresentOn(floors[0], floors[1], floors[2]))
        {
            failure("an entity is present on the block.");
            return false;
        }*/

        return true;
    }

}

export default UpdateAPI;
