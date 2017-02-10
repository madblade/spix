/**
 *
 */

'use strict';

import GeometryUtils    from '../../../math/geometry';
import NumberUtils      from '../../../math/numbers';

class UpdaterAccess {

    static addBlock(originEntity, x, y, z, blockId, world, entityModel)
    {
        const dimX = world.xSize, dimY = world.ySize, dimZ = world.zSize;
        let chunkCoordinates = world.getChunkCoordinates(x, y, z);
        let chunk = world.getChunk(...chunkCoordinates);
        let worldId = world.worldId;

        let xOnChunk = (x >= 0 ? x : dimX-((-x)%dimX)) % dimX;
        let yOnChunk = (y >= 0 ? y : dimY-((-y)%dimY)) % dimY;
        let zOnChunk = (z >= 0 ? z : dimZ-((-z)%dimZ)) % dimZ;
        //console.log(xOnChunk + ',' + yOnChunk + ',' + zOnChunk);

        let coordsOnChunk = [xOnChunk, yOnChunk, zOnChunk];

        function failure(reason) { console.log('Request denied: ' + reason); }

        if (!UpdaterAccess.validateBlockEdition(originEntity, x, y, z)) {
            failure('Requested location is too far away.');
            return;
        }

        if (chunk.what(...coordsOnChunk) !== 0) {
            failure('Cannot add a block on a non-empty block.');
            return;
        }

        if (entityModel.anEntityIsPresentOn(worldId, x, y, z))
        {
            failure('An entity is present on the block.');
            return false;
        }

        return [chunk, ...coordsOnChunk, blockId];
    }

    static delBlock(originEntity, x, y, z, world, entityModel)
    {
        // Translate.
        const dimX = world.xSize, dimY = world.ySize, dimZ = world.zSize;
        let chunkCoordinates = world.getChunkCoordinates(x, y, z);
        let chunk = world.getChunk(...chunkCoordinates);

        let xOnChunk = (x >= 0 ? x : dimX-((-x)%dimX)) % dimX;
        let yOnChunk = (y >= 0 ? y : dimY-((-y)%dimY)) % dimY;
        let zOnChunk = (z >= 0 ? z : dimZ-((-z)%dimZ)) % dimZ;

        let coordsOnChunk = [xOnChunk, yOnChunk, zOnChunk];

        // Validate.
        function failure(reason) { console.log('Request denied: ' + reason); }

        if (!UpdaterAccess.validateBlockEdition(originEntity, x, y, z)) {
            failure('requested location is too far away.');
            return;
        }

        if (chunk.what(...coordsOnChunk) === 0) {
            failure('Cannot delete an empty block.');
            return;
        }

        return [chunk, ...coordsOnChunk];
    }

    static validateBlockEdition(originEntity, x, y, z) {
        // 10 blocks maximum range for block editing.
        const d3 = GeometryUtils.euclideanDistance3(originEntity.position, [x+.5, y+.5, z+.5]);
        return (d3 < 10);
    }

}

export default UpdaterAccess;
