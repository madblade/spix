/**
 *
 */

'use strict';

import CollectionUtils from '../../../math/collections';
import { BlockType } from '../../model_world/model'; // Get linkage strategy.

class UpdaterFace
{
    /**
     * @deprecated
     */
    static detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, faces)
    {
        // Criterion: at least 2 surface faces that do not link on the inserted cube.
        // i.e. if blocking edges form a cycle.
        // Detects POTENTIAL local topology changes.

        // Compute blocking edges.
        let blockingEdges = [];
        // x-
        if (faces[0] && faces[2] && chunk.contains(x - 1, y - 1, z)) blockingEdges.push([0, 4]);
        if (faces[0] && faces[3] && chunk.contains(x - 1, y + 1, z)) blockingEdges.push([3, 7]);
        if (faces[0] && faces[4] && chunk.contains(x - 1, y, z - 1)) blockingEdges.push([4, 7]);
        if (faces[0] && faces[5] && chunk.contains(x - 1, y, z + 1)) blockingEdges.push([0, 3]);
        // x+
        if (faces[1] && faces[2] && chunk.contains(x + 1, y - 1, z)) blockingEdges.push([1, 5]);
        if (faces[1] && faces[3] && chunk.contains(x + 1, y + 1, z)) blockingEdges.push([2, 6]);
        if (faces[1] && faces[4] && chunk.contains(x + 1, y, z - 1)) blockingEdges.push([5, 6]);
        if (faces[1] && faces[5] && chunk.contains(x + 1, y, z + 1)) blockingEdges.push([1, 2]);
        // y+-z
        if (faces[2] && faces[4] && chunk.contains(x, y - 1, z - 1)) blockingEdges.push([4, 5]);
        if (faces[2] && faces[5] && chunk.contains(x, y - 1, z + 1)) blockingEdges.push([0, 1]);
        if (faces[3] && faces[4] && chunk.contains(x, y + 1, z - 1)) blockingEdges.push([6, 7]);
        if (faces[3] && faces[5] && chunk.contains(x, y + 1, z + 1)) blockingEdges.push([2, 3]);

        // Detect loop.
        let ls = [];
        for (let i = 0; i < blockingEdges.length; ++i)
        {
            let bi = blockingEdges[i];
            let found = false;

            for (let j = 0; j < ls.length; ++j)
            {
                let last = ls[j].length - 1;
                if (ls[j][last] === bi[0]) {
                    ls[j].push(bi[1]);
                    found = true;
                }
                if (ls[j][last] === bi[1]) {
                    ls[j].push(bi[0]);
                    found = true;
                }
                if (ls[j][0] === ls[j][last + 1]) { // Loop detected.
                    if (ls[j].length < 4) console.log('invalid detectProbableTopologyChangeAfterAddition algorithm');
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

    static addFaceToChunk(
        chunk, x, y, z,
        direction, faceNature, fromAddition)
    {
        if (faceNature === BlockType.AIR)
        {
            console.error('[UpdaterFace] Can’t add air face.');
        }

        let blockStride = chunk._toIdUnsafe(x, y, z);
        let dimensions = chunk.dimensions;
        let faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(blockStride, direction, dimensions);

        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        let componentId = faceNature === BlockType.WATER ? 2 : 1; // water

        if (fromAddition) {
            if (direction % 2 === 0) faceNature *= -1;
        } else if (!fromAddition) {
            if (direction % 2 !== 0) faceNature *= -1;
        }
        connectedComponents[faceId] = componentId;

        if (!fastComponents[componentId])
        {
            // console.error(`BLD: invalid component id: ${componentId} for insertion.`);
            // console.log(fastComponents);
            // console.log(fastComponentsIds);
            // console.log(connectedComponents);
            // Create new components.
            fastComponents[componentId] = [faceId];
            fastComponentsIds[componentId] = [faceNature];
        } else {
            const location = CollectionUtils.insert(faceId, fastComponents[componentId]);
            let fastIds = fastComponentsIds[componentId];
            fastIds.splice(location, 0, faceNature);
        }

        // Apply update.
        let updates = chunk.updates;
        let removedUpdt = updates[0];
        let addedUpdt = updates[1];
        let changedUpdt = updates[2];
        let nbp = CollectionUtils.numberOfProperties;
        const updatesEmpty = nbp(removedUpdt) === 0 && nbp(addedUpdt) === 0 && nbp(changedUpdt) === 0;
        if (!updatesEmpty && removedUpdt.hasOwnProperty(faceId))
        {
            delete removedUpdt[faceId]; // if it is marked as 'removed', then it exists in the original array
            changedUpdt[faceId] = faceNature; //connectedComponents[fid];
        } else {
            addedUpdt[faceId] = faceNature; // connectedComponents[fid];
        }
    }

    static removeFaceFromChunk(
        chunk, x, y, z,
        direction)
    {
        let blockStride = chunk._toIdUnsafe(x, y, z);
        let dimensions = chunk.dimensions;
        let faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(blockStride, direction, dimensions);

        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        const componentId = connectedComponents[faceId];
        if (!componentId)
        {
            console.error(`[UpdaterFace] Face id ${faceId} not in connected components.`);
            console.log(componentId);
        }
        if (componentId < 1)
        {
            console.warn(`WARN: trying to remove a face that is not
                    registered as boundary: component id = ${faceId}.
                `);
            return;
        }

        let currentComponent = fastComponents[componentId];
        if (!currentComponent) {
            let e = new Error(`BLD: skipping removal on component ${componentId}`);
            console.error(`BLD: skipping removal on component ${componentId}`);
            console.log(e.stack);
            return;
        }

        let index = CollectionUtils.removeFromArray(currentComponent, faceId);
        if (currentComponent.length === 0)
            delete fastComponents[componentId];

        let currentComponentsIds = fastComponentsIds[componentId];
        CollectionUtils.removeFromArrayWithId(currentComponentsIds, index);
        if (currentComponentsIds.length === 0)
            delete fastComponentsIds[componentId];

        connectedComponents[faceId] = 0;

        // Push update.
        let updates = chunk.updates;
        let removedUpdt = updates[0];
        let addedUpdt = updates[1];
        let changedUpdt = updates[2];

        let nbp = CollectionUtils.numberOfProperties;
        const updatesEmpty = nbp(removedUpdt) === 0 && nbp(addedUpdt) === 0 && nbp(changedUpdt) === 0;

        if (!updatesEmpty && addedUpdt.hasOwnProperty(faceId)) {
            delete addedUpdt[faceId]; // if it is marked as 'added', then it does not exist in the original array
        } else {
            removedUpdt[faceId] = null;
        }
    }

    static updateOneFaceFromAddition(
        chunk, otherUpdatedChunks,
        airBlock, waterBlock, isAddedBlockWater,
        blockId, otherBlockId,
        x, y, z, xTest, yTest, zTest, condition, direction)
    {
        let current;
        if (condition)
        {
            current = chunk.queryChunk(xTest, yTest, zTest);
            if (x !== xTest) current[1] += 1;
            if (y !== yTest) current[2] += 1;
            if (z !== zTest) current[3] += 1;
            otherUpdatedChunks.push(current[0]);
        } else {
            current = [chunk, x, y, z];
        }

        if (otherBlockId === airBlock)
        {
            // add face to this.
            UpdaterFace.addFaceToChunk(
                current[0], current[1], current[2], current[3],
                direction, blockId, true
            );
        }
        else if (otherBlockId === waterBlock && !isAddedBlockWater)
        {
            // delete other block face and add face to this.
            UpdaterFace.removeFaceFromChunk(
                current[0], current[1], current[2], current[3],
                direction
            );
            UpdaterFace.addFaceToChunk(
                current[0], current[1], current[2], current[3],
                direction, blockId, true);
        }
        else if (
            otherBlockId === waterBlock && isAddedBlockWater ||
            otherBlockId !== airBlock && otherBlockId !== waterBlock && !isAddedBlockWater)
        {
            // delete other block face.
            UpdaterFace.removeFaceFromChunk(
                current[0], current[1], current[2], current[3],
                direction
            );
        }
    }

    static updateSurfaceFacesAfterAddition2(chunk, id, x, y, z, blockId)
    {
        if (!chunk.ready) {
            console.warn('[UpdaterFaces] Addition: chunk faces not ready.');
            return false;
        }
        let otherUpdatedChunks = [];

        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;
        let isAddedBlockWater = blockId === waterBlock;

        let a = chunk.queryBlock(x - 1, y, z);
        if (a < 0) {
            console.warn('[UpdaterFaces] Addition: neighbor chunk faces not ready.');
            return false;
        }
        let b = chunk.queryBlock(x + 1, y, z);
        if (b < 0) {
            console.warn('[UpdaterFaces] Addition: neighbor chunk faces not ready.');
            return false;
        }
        let c = chunk.queryBlock(x, y - 1, z);
        if (c < 0) {
            console.warn('[UpdaterFaces] Addition: neighbor chunk faces not ready.');
            return false;
        }
        let d = chunk.queryBlock(x, y + 1, z);
        if (d < 0) {
            console.warn('[UpdaterFaces] Addition: neighbor chunk faces not ready.');
            return false;
        }
        let e = chunk.queryBlock(x, y, z - 1);
        if (e < 0) {
            console.warn('[UpdaterFaces] Addition: neighbor chunk faces not ready.');
            return false;
        }
        let f = chunk.queryBlock(x, y, z + 1);
        if (f < 0) {
            console.warn('[UpdaterFaces] Addition: neighbor chunk faces not ready.');
            return false;
        }

        UpdaterFace.updateOneFaceFromAddition(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isAddedBlockWater, blockId,
            a, x, y, z,
            x - 1, y, z, x === 0, 0
        );
        UpdaterFace.updateOneFaceFromAddition(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isAddedBlockWater, blockId,
            b, x, y, z,
            x + 1, y, z, false, 1
        );

        UpdaterFace.updateOneFaceFromAddition(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isAddedBlockWater, blockId,
            c, x, y, z,
            x, y - 1, z, y === 0, 2
        );
        UpdaterFace.updateOneFaceFromAddition(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isAddedBlockWater, blockId,
            d, x, y, z,
            x, y + 1, z, false, 3
        );

        UpdaterFace.updateOneFaceFromAddition(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isAddedBlockWater, blockId,
            e, x, y, z,
            x, y, z - 1, z === 0, 4
        );
        UpdaterFace.updateOneFaceFromAddition(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isAddedBlockWater, blockId,
            f, x, y, z,
            x, y, z + 1, false, 5
        );

        return otherUpdatedChunks;
    }

    static updateOneFaceFromDeletion(
        chunk, otherUpdatedChunks,
        airBlock, waterBlock, isRemovedBlockWater,
        otherBlockId,
        x, y, z, xTest, yTest, zTest, condition, direction)
    {
        // Removed
        let current;
        if (condition)
        {
            current = chunk.queryChunk(xTest, yTest, zTest);
            if (x !== xTest) current[1] += 1;
            if (y !== yTest) current[2] += 1;
            if (z !== zTest) current[3] += 1;
            otherUpdatedChunks.push(current[0]);
        } else {
            current = [chunk, x, y, z];
        }

        if (otherBlockId === airBlock)
        {
            // delete this face.
            UpdaterFace.removeFaceFromChunk(
                current[0], current[1], current[2], current[3],
                direction
            );
        }
        else if (otherBlockId === waterBlock && !isRemovedBlockWater)
        {
            // delete this face and add other block face water.
            UpdaterFace.removeFaceFromChunk(
                current[0], current[1], current[2], current[3],
                direction
            );
            UpdaterFace.addFaceToChunk(
                current[0], current[1], current[2], current[3],
                direction, otherBlockId, false
            );
        }
        else if (otherBlockId === waterBlock && isRemovedBlockWater ||
            otherBlockId !== airBlock && otherBlockId !== waterBlock && !isRemovedBlockWater)
        {
            // add other block face.
            UpdaterFace.addFaceToChunk(
                current[0], current[1], current[2], current[3],
                direction, otherBlockId, false
            );
        }
    }

    static updateSurfaceFacesAfterDeletion2(
        chunk, id, x, y, z, blockId
    )
    {
        if (!chunk.ready) {
            console.warn('[UpdaterFaces] Deletion: chunk faces not ready.');
            return false;
        }
        let otherUpdatedChunks = [];

        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;

        // let blockId = chunk.queryBlock(x, y, z);
        let isRemovedBlockWater = blockId === waterBlock;

        let a = chunk.queryBlock(x - 1, y, z);
        if (a < 0) {
            console.warn('[UpdaterFaces] Deletion: neighbor faces not ready.');
            return false;
        }
        let b = chunk.queryBlock(x + 1, y, z);
        if (b < 0) {
            console.warn('[UpdaterFaces] Deletion: neighbor faces not ready.');
            return false;
        }
        let c = chunk.queryBlock(x, y - 1, z);
        if (c < 0) {
            console.warn('[UpdaterFaces] Deletion: neighbor faces not ready.');
            return false;
        }
        let d = chunk.queryBlock(x, y + 1, z);
        if (d < 0) {
            console.warn('[UpdaterFaces] Deletion: neighbor faces not ready.');
            return false;
        }
        let e = chunk.queryBlock(x, y, z - 1);
        if (e < 0) {
            console.warn('[UpdaterFaces] Deletion: neighbor faces not ready.');
            return false;
        }
        let f = chunk.queryBlock(x, y, z + 1);
        if (f < 0) {
            console.warn('[UpdaterFaces] Deletion: neighbor faces not ready.');
            return false;
        }

        UpdaterFace.updateOneFaceFromDeletion(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isRemovedBlockWater,
            a, x, y, z,
            x - 1, y, z, x === 0, 0
        );
        UpdaterFace.updateOneFaceFromDeletion(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isRemovedBlockWater,
            b, x, y, z,
            x + 1, y, z, false, 1
        );

        UpdaterFace.updateOneFaceFromDeletion(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isRemovedBlockWater,
            c, x, y, z,
            x, y - 1, z, y === 0, 2
        );
        UpdaterFace.updateOneFaceFromDeletion(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isRemovedBlockWater,
            d, x, y, z,
            x, y + 1, z, false, 3
        );

        UpdaterFace.updateOneFaceFromDeletion(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isRemovedBlockWater,
            e, x, y, z,
            x, y, z - 1, z === 0, 4
        );
        UpdaterFace.updateOneFaceFromDeletion(
            chunk, otherUpdatedChunks, airBlock, waterBlock, isRemovedBlockWater,
            f, x, y, z,
            x, y, z + 1, false, 5
        );

        return otherUpdatedChunks;
    }

    /**
     * Gets the id of a face taken from a block.
     * @param id block id
     * @param normal which of the 6 faces (+/- x/y/z)
     * 0 -> x-, 1 -> x+, 2 -> y-, 3 -> y+, 4 -> z-, 5 -> z+.
     * @param dimensions chunk size
     */
    static getFaceIdFromCoordinatesAndNormal(id, normal, dimensions)
    {
        let ddd = dimensions[0] * dimensions[1] * dimensions[2];
        switch (normal)
        {
            case 0: // x-
                return id - 1;
            case 2: // y-
                return ddd + id - dimensions[0];
            case 4: // z-
                return 2 * ddd + id - dimensions[0] * dimensions[1];

            case 1: // x+
                return id;
            case 3: // y+
                return ddd + id;
            case 5: // z+
                return 2 * ddd + id;
            default:
        }
    }

    static addFaceToModel(chunk, faceId, kind)
    {
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        const cc = 1; // not topology-aware
        connectedComponents[faceId] = cc;
        if (fastComponents.hasOwnProperty(cc)) {
            fastComponents[cc].push(faceId);
            fastComponentsIds[cc].push(kind);
        } else {
            console.log(`ERROR @addFaceToModel: fastComponents doesnt have a ${cc} component. ` +
                `face id: ${faceId} kind: ${kind}`);
            fastComponents[cc] = [faceId];
            fastComponentsIds[cc] = [kind];
        }
    }

    static removeFaceFromModel(chunk, faceId)
    {
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        let cc = connectedComponents[faceId];
        const id = CollectionUtils.removeFromArray(fastComponents[cc], faceId);
        CollectionUtils.removeFromArrayWithId(fastComponentsIds[cc], id);
        connectedComponents[faceId] = 0;
    }
}

export default UpdaterFace;
