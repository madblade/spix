/**
 *
 */

'use strict';

class UpdaterAPI {

    static addBlock(originEntity, x, y, z, blockId, worldManager, entityManager) {
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = worldManager.getChunkCoordinates(floors[0], floors[1], floors[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];
        const chunkId = i+','+j;
        var chunk = worldManager.allChunks[chunkId];
        console.log("Transaction required on " + chunkId);
        if (!chunk || chunk === undefined) { console.log('Could not find chunk ' + chunkId); return; }

        // Validate request.
        let blockCoordinatesOnChunk = [
            floors[0] - i * worldManager.chunkDimensionX,
            floors[1] - j * worldManager.chunkDimensionY,
            floors[2] - k * worldManager.chunkDimensionZ
        ];
        if (!UpdaterAPI.translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk, entityManager))
        return;

        // Add block on chunk.
        chunk.add(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2], blockId);

        // Remember this chunk was touched.
        worldManager.chunkUpdated(chunkId);
    }

    static delBlock(originEntity, x, y, z, worldManager, entityManager) {
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = worldManager.getChunkCoordinates(floors[0], floors[1], floors[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];
        const chunkId = i+','+j;
        var chunk = worldManager.allChunks[chunkId];

        console.log("Transaction required on " + chunkId);
        if (!chunk || chunk === undefined) { console.log('Could not find chunk ' + chunkId); return; }

        // Validate request.
        let blockCoordinatesOnChunk = [
            floors[0] - i * worldManager.chunkDimensionX,
            floors[1] - j * worldManager.chunkDimensionY,
            floors[2] - k * worldManager.chunkDimensionZ
        ];
        if (!UpdaterAPI.translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk, entityManager))
            return;

        // Add block on chunk.
        // console.log(blockCoordinatesOnChunk);
        chunk.del(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]);

        // Remember this chunk was touched.
        worldManager.chunkUpdated(chunkId);
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
        const d3 = UpdaterAPI.distance3(originEntity.position, [fx+.5, fy+.5, fz+.5]);
        return (d3 < 10);
    }

    static translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk, entityManager) {
        function failure(reason) { console.log("Request denied: " + reason); }

        if (!UpdaterAPI.validateBlockEdition(originEntity, x, y, z, floors)) {
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

        if (dx === 0 && dy !== 0 && dz !== 0) {
            // Which side of the face is empty...
            if (chunk.what(lx-1, ly, lz) === 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;

        } else if (dx !== 0 && dy === 0 && dz !== 0) {
            if (chunk.what(lx, ly-1, lz) === 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;

        } else if (dx !== 0 && dy !== 0 && dz === 0) {
            if (chunk.what(lx, ly, lz-1) === 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;

            // On-edge request.
        } else {
            failure("precision (on-edge request).");
            return false;
        }

        // Designed block must be 0.
        // console.log(blockCoordinatesOnChunk);
        if (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) !== 0) {
            failure("block is not empty.");
            return false;
        }

        // Detect OOB.
        if (blockCoordinatesOnChunk[0] < 0 || blockCoordinatesOnChunk[0] >= chunk.dimensions[0] ||
            blockCoordinatesOnChunk[1] < 0 || blockCoordinatesOnChunk[1] >= chunk.dimensions[1] ||
            blockCoordinatesOnChunk[2] < 0 || blockCoordinatesOnChunk[2] >= chunk.dimensions[2]) {
            failure("block is OOB for its relative chunk.");
            return false;
        }

        // Detect entities.
        if (entityManager.anEntityIsPresentOn(floors[0], floors[1], floors[2])) {
            failure("an entity is present on the block.");
            return false;
        }

        return true;
    }

    static translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk, entityManager) {
        function failure(reason) { console.log("Request denied: " + reason); }

        if (!UpdaterAPI.validateBlockEdition(originEntity, x, y, z, floors)) {
            failure("distance not validated by world manager.");
            return false;
        }

        const dx = Math.abs(Math.abs(x) - Math.abs(floors[0]));
        const dy = Math.abs(Math.abs(y) - Math.abs(floors[1]));
        const dz = Math.abs(Math.abs(z) - Math.abs(floors[2]));

        const lx = blockCoordinatesOnChunk[0]; // l stands for local
        const ly = blockCoordinatesOnChunk[1];
        const lz = blockCoordinatesOnChunk[2];

        if (dx === 0 && dy !== 0 && dz !== 0) {
            if (chunk.what(lx-1, ly, lz) !== 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;

        } else if (dx !== 0 && dy === 0 && dz !== 0) {
            if (chunk.what(lx, ly-1, lz) !== 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;

        } else if (dx !== 0 && dy !== 0 && dz === 0) {
            if (chunk.what(lx, ly, lz-1) !== 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;

            // On-edge request.
        } else {
            failure("precision (on-edge request).");
            return false;
        }

        // Designed block must be 0.
        if (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) === 0) {
            failure("block is already empty.");
            return false;
        }

        // Detect OOB.
        if (blockCoordinatesOnChunk[0] < 0 || blockCoordinatesOnChunk[0] >= chunk.dimensions[0] ||
            blockCoordinatesOnChunk[1] < 0 || blockCoordinatesOnChunk[1] >= chunk.dimensions[1] ||
            blockCoordinatesOnChunk[2] < 0 || blockCoordinatesOnChunk[2] >= chunk.dimensions[2]) {
            failure("block is OOB for its relative chunk.");
            return false;
        }

        // Validate update.
        if (entityManager.anEntityIsPresentOn(floors[0], floors[1], floors[2])) {
            failure("an entity is present on the block.");
            return false;
        }

        return true;
    }

}

export default UpdaterAPI;
