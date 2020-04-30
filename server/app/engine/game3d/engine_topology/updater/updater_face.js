/**
 *
 */

'use strict';

import CollectionUtils from '../../../math/collections';
// import CSFX from '../../engine_consistency/builder/surface_faces_builder';
import { BlockType } from '../../model_world/model'; // Get linkage strategy.

class UpdaterFace
{
    /**
     * @deprecated
     */
    static detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, faces) {
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
        if (faceNature === BlockType.AIR) {
            console.error('[UpdaterFace] Can’t add air face.');
        }

        let blockStride = chunk._toId(x, y, z);
        let dimensions = chunk.dimensions;
        let faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(blockStride, direction, dimensions);

        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        let componentId = faceNature === BlockType.WATER ? 2 : 1; // water

        if (!fastComponents[componentId])
        {
            console.error(`BLD: invalid component id: ${componentId} for insertion.`);
            console.log(fastComponents);
            console.log(fastComponentsIds);
            console.log(connectedComponents);
            fastComponents[componentId] = [];
            fastComponentsIds[componentId] = [];
        }

        connectedComponents[faceId] = componentId;
        const location = CollectionUtils.insert(faceId, fastComponents[componentId]);
        let fastIds = fastComponentsIds[componentId];
        if (fromAddition) {
            if (direction % 2 === 0) faceNature *= -1;
        } else if (!fromAddition) {
            if (direction % 2 !== 0) faceNature *= -1;
        }
        fastIds.splice(location, 0, faceNature);

        // Apply update.
        let updates = chunk.updates;
        let removedUpdt = updates[0];
        let addedUpdt = updates[1];
        let changedUpdt = updates[2];
        let nbp = CollectionUtils.numberOfProperties;
        const updatesEmpty = nbp(removedUpdt) === 0 && nbp(addedUpdt) === 0 && nbp(changedUpdt) === 0;
        if (!updatesEmpty && removedUpdt.hasOwnProperty(faceId)) {
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
        let blockStride = chunk._toId(x, y, z);
        let dimensions = chunk.dimensions;
        let faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(blockStride, direction, dimensions);

        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        const componentId = connectedComponents[faceId];
        if (!componentId) {
            console.error(`[UpdaterFace] Face id ${faceId} not in connected components.`);
            console.log(componentId);
        }
        if (componentId < 1) {
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
        if (condition) {
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
        let otherUpdatedChunks = [];

        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;
        let isAddedBlockWater = blockId === waterBlock;

        let a = chunk.queryBlock(x - 1, y, z);
        let b = chunk.queryBlock(x + 1, y, z);
        let c = chunk.queryBlock(x, y - 1, z);
        let d = chunk.queryBlock(x, y + 1, z);
        let e = chunk.queryBlock(x, y, z - 1);
        let f = chunk.queryBlock(x, y, z + 1);

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
        if (condition) {
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
        chunk, id, x, y, z)
    {
        let otherUpdatedChunks = [];

        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;

        let blockId = chunk.queryBlock(x, y, z);
        let isRemovedBlockWater = blockId === waterBlock;

        let a = chunk.queryBlock(x - 1, y, z);
        let b = chunk.queryBlock(x + 1, y, z);
        let c = chunk.queryBlock(x, y - 1, z);
        let d = chunk.queryBlock(x, y + 1, z);
        let e = chunk.queryBlock(x, y, z - 1);
        let f = chunk.queryBlock(x, y, z + 1);

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

    // BLOCK ADDITION
    // The difficulty is to determine which surface faces belong to which component after an addition.
    /**
     * @deprecated
     */
    static updateSurfaceFacesAfterAddition(chunk, id, x, y, z, blockId)
    {
        let airBlock = BlockType.AIR;
        let waterBlock = BlockType.WATER;

        let dimensions = chunk.dimensions;

        // Compute concerned faces.
        let addedFaces = [
            false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false  // z+
        ];

        if (x > 0 && !chunk.contains(x - 1, y, z)) addedFaces[0] = true;
        if (x < dimensions[0] - 1 && !chunk.contains(x + 1, y, z)) addedFaces[1] = true;
        if (y > 0 && !chunk.contains(x, y - 1, z)) addedFaces[2] = true;
        if (y < dimensions[1] - 1 && !chunk.contains(x, y + 1, z)) addedFaces[3] = true;
        if (z > 0 && !chunk.contains(x, y, z - 1)) addedFaces[4] = true;
        if (z < dimensions[2] - 1 && !chunk.contains(x, y, z + 1)) addedFaces[5] = true;

        let removedFaces = [
            !addedFaces[0] && x > 0,             // x-
            !addedFaces[1] && x < dimensions[0] - 1, // x+
            !addedFaces[2] && y > 0,             // y-
            !addedFaces[3] && y < dimensions[1] - 1, // y+
            !addedFaces[4] && z > 0,             // z-
            !addedFaces[5] && z < dimensions[2] - 1  // z+
            // N.B. whatever the block update, there will always be 6 modified faces (non-boundary case).
        ];

        UpdaterFace.rawUpdateAfterEdition(chunk, id, x, y, z, addedFaces, removedFaces, true, true);

        if (UpdaterFace.detectProbableTopologyChangeAfterAddition(chunk, id, x, y, z, addedFaces))
        // N.B. a necessary yet not sufficient condition for effective division of components within the chunk.
            UpdaterFace.divideConnectedComponents(chunk, id, x, y, z, addedFaces);

        // Topology-preserving boundary faces edition
        return UpdaterFace.updateFacesOnBoundary(chunk, x, y, z, true);
    }

    /**
     * Gets the id of a face taken from a block.
     * @param id block id
     * @param normal which of the 6 faces (+/- x/y/z)
     * 0 -> x-, 1 -> x+, 2 -> y-, 3 -> y+, 4 -> z-, 5 -> z+.
     * @param dimensions chunk size
     */
    static getFaceIdFromCoordinatesAndNormal(id, normal, dimensions) {
        let ddd = dimensions[0] * dimensions[1] * dimensions[2];
        switch (normal) { // TODO boundary management...
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

    // ADDITION ONLY
    /**
     * @deprecated
     */
    static getFaceNatureFromIdAndNormal(chunk, x, y, z, direction)
    {
        let currentBlock = chunk.what(x, y, z);
        let thisEmpty = currentBlock === 0;
        if (!thisEmpty) return currentBlock;

        let dimensions = chunk.dimensions;
        switch (direction) {
            case 0: // x-
                if (x > 0) return chunk.what(x - 1, y, z);
                break;

            case 1: // x+
                if (x + 1 < dimensions[0]) return chunk.what(x + 1, y, z);
                break;

            case 2: // y-
                if (y > 0) return chunk.what(x, y - 1, z);
                break;

            case 3: // y+
                if (y + 1 < dimensions[1]) return chunk.what(x, y + 1, z);
                break;

            case 4: // z-
                if (z > 0) return chunk.what(x, y, z - 1);
                break;

            case 5: // z+
                if (z + 1 < dimensions[2]) return chunk.what(x, y, z + 1);
                break;

            default: break;
        }
        return 0;
    }

    /**
     * very old method, to be removed
     * @deprecated
     */
    static rawUpdateAfterEdition(
        chunk, id, x, y, z, addedFaces, removedFaces,
        isAddition, isWater)
    {
        // Compute updated faces.
        let dimensions = chunk.dimensions;

        let removedFaceIds = new Int32Array(removedFaces.length);
        let addedFaceIds = new Int32Array(addedFaces.length);

        for (let normal = 0, l = removedFaces.length; normal < l; ++normal)
        {
            if (!removedFaces[normal] && !addedFaces[normal]) {
                removedFaceIds[normal] = addedFaceIds[normal] = -1;
                continue;
            }
            let faceId = UpdaterFace.getFaceIdFromCoordinatesAndNormal(id, normal, dimensions);

            if (removedFaces[normal]) removedFaceIds[normal] = faceId;
            else removedFaceIds[normal] = -1;
            if (addedFaces[normal]) addedFaceIds[normal] = faceId;
            else addedFaceIds[normal] = -1;
        }

        //console.log('UPDATING COMPONENTS');
        //console.log(removedFaceIds);
        //console.log(addedFaceIds);

        // Update components.
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        // Remove
        for (let i = 0, l = removedFaceIds.length; i < l; ++i)
        {
            const fid = removedFaceIds[i];
            if (fid === -1) continue;

            const componentId = connectedComponents[fid];
            if (!componentId) {
                console.error(`[UpdaterFace] Face id ${fid} not in connected components.`);
            }
            if (componentId < 1) {
                console.warn(`WARN: trying to remove a face that is not
                    registered as boundary: component id = ${componentId}.
                `);
                continue;
            }

            let currentComponent = fastComponents[componentId];
            if (!currentComponent) {
                let e = new Error(`BLD: skipping removal on component ${componentId}`);
                console.error(`BLD: skipping removal on component ${componentId}`);
                console.log(e.stack);
                continue;
            }
            let index = CollectionUtils.removeFromArray(currentComponent, fid);
            if (currentComponent.length === 0) delete fastComponents[componentId];

            let currentComponentsIds = fastComponentsIds[componentId];
            CollectionUtils.removeFromArrayWithId(currentComponentsIds, index);
            if (currentComponentsIds.length === 0) delete fastComponentsIds[componentId];

            connectedComponents[fid] = 0;
        }

        // Insert
        let newFaceNature = {};
        for (let i = 0, l = addedFaceIds.length; i < l; ++i)
        {
            const fid = addedFaceIds[i];
            if (fid === -1) continue;

            // Dropped topology support. Now only using a preset of components.
            const componentId = isWater ? 2 : 1;

            if (fastComponents[componentId] === undefined)
            {
                // TODO check borders with this approach
                // Somehow getting here means that the added block isn't topologically linked to any other
                // component. So we have to create a new component id.
                let e = new Error(`BLD: invalid component id: ${componentId} for insertion... BLDing.`);
                console.error(`BLD: invalid component id: ${componentId} for insertion.`);
                console.log(e.stack);
                console.log(fastComponents);
                console.log(fastComponentsIds);
                console.log(connectedComponents);

                fastComponents[componentId] = [];
                fastComponentsIds[componentId] = [];
            }

            const location = CollectionUtils.insert(fid, fastComponents[componentId]);
            let fastIds = fastComponentsIds[componentId];

            let faceNature = UpdaterFace.getFaceNatureFromIdAndNormal(chunk, x, y, z, i);
            if (faceNature === 0) continue; // TODO [FIX] face color change hint

            if (isAddition) {
                if (i % 2 === 0) faceNature *= -1;
            } else if (!isAddition) {
                if (i % 2 !== 0) faceNature *= -1;
            }

            newFaceNature[i] = faceNature;
            fastIds.splice(location, 0, faceNature);
            connectedComponents[fid] = componentId;
        }

        // Update updates.
        /**
         * UPDATES FORMAT
         * [ {}, {}, {} ]
         * {} -> removed (faceIds)
         * {} -> added (faceId -> nature)
         * {} -> changedComponents (faceId -> new nature)
         */
        let updates = chunk.updates;
        let removedUpdt = updates[0];
        let addedUpdt = updates[1];
        let changedUpdt = updates[2];

        let nbp = CollectionUtils.numberOfProperties;
        const updatesEmpty = nbp(removedUpdt) === 0 && nbp(addedUpdt) === 0 && nbp(changedUpdt) === 0;

        for (let i = 0, l = addedFaceIds.length; i < l; ++i) {
            let fid = addedFaceIds[i];
            if (fid === -1) continue;

            if (!updatesEmpty && removedUpdt.hasOwnProperty(fid)) {
                delete removedUpdt[fid]; // if it is marked as 'removed', then it exists in the original array
                changedUpdt[fid] = newFaceNature[i]; //connectedComponents[fid];
            } else {
                addedUpdt[fid] = newFaceNature[i]; // connectedComponents[fid];
            }
        }

        for (let i = 0, l = removedFaceIds.length; i < l; ++i) {
            let fid = removedFaceIds[i];
            if (fid === -1) continue;

            if (!updatesEmpty && addedUpdt.hasOwnProperty(fid)) {
                delete addedUpdt[fid]; // if it is marked as 'added', then it does not exist in the original array
            } else {
                removedUpdt[fid] = null;
            }
        }
    }

    /**
     *  This was never implemented (and never will be).
     *  @deprecated
     */
    static divideConnectedComponents(/*chunk, id, x, y, z, addedFaces*/) {
        // let nbp = CollectionUtils.numberOfProperties;
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
        // Beware of component disappearance in client.
    }

    /**
     * @deprecated
     */
    static detectTopologyChangeAfterDeletion(chunk, id, x, y, z) {
        // Criterion: pre-existing faces belonged to separate connected components.
        // N.B. We could have considered this a dual of topology change detection after addition.
        // and call detectProbableTopologyChangeAfterDeletion(chunk, id, x, y, z, removedFaces)
        // but it is computationally easier to check immediate neighborhoods for distinct CCs.

        let connectedComponents = chunk.connectedComponents;
        const capacity = chunk.capacity;
        let dimensions = chunk.dimensions;
        const facePlusId = chunk._toId(x, y, z);
        let ccids = [];

        if (x < dimensions[0]) ccids.push(connectedComponents[facePlusId]);
        if (y < dimensions[1]) ccids.push(connectedComponents[capacity + facePlusId]);
        if (z < dimensions[2]) ccids.push(connectedComponents[2 * capacity + facePlusId]);
        if (x > 0) ccids.push(connectedComponents[chunk._toId(x - 1, y, z)]);
        if (y > 0) ccids.push(connectedComponents[capacity + chunk._toId(x, y - 1, z)]);
        if (z > 0) ccids.push(connectedComponents[2 * capacity + chunk._toId(x, y, z - 1)]);

        let first = ccids[0];
        for (let i = 1; i < ccids.length; ++i) {
            if (ccids[i] !== first) return true;
        }
        return false;
    }

    static addFaceToModel(chunk, faceId, kind) {
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        const cc = 1; // TODO Topology
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

    static removeFaceFromModel(chunk, faceId) {
        let connectedComponents = chunk.connectedComponents;
        let fastComponents = chunk.fastComponents;
        let fastComponentsIds = chunk.fastComponentsIds;

        let cc = connectedComponents[faceId];
        const id = CollectionUtils.removeFromArray(fastComponents[cc], faceId);
        CollectionUtils.removeFromArrayWithId(fastComponentsIds[cc], id);
        connectedComponents[faceId] = 0;
    }

    /**
     * @deprecated
     */
    static updateFace(w, wOrigin, fid, chunk, isAddition) {
        let updates = chunk.updates;
        // TODO REMOVE FACES FROM MODEL.

        // Adding a block.
        if (isAddition) {
            if (w !== 0) { // remove face
                if (updates[1].hasOwnProperty(fid)) delete updates[1][fid];
                else updates[0][fid] = null;
                UpdaterFace.removeFaceFromModel(chunk, fid);
            }
            else { // add face
                if (updates[0].hasOwnProperty(fid)) {
                    delete updates[0][fid];
                    updates[2][fid] = wOrigin;
                }
                else updates[1][fid] = wOrigin;
                UpdaterFace.addFaceToModel(chunk, fid, wOrigin);
            }

            // Removing a block.
        } else if (!isAddition) {
            if (w !== 0) { // add face
                if (updates[0].hasOwnProperty(fid)) {
                    delete updates[0][fid];
                    updates[2][fid] = w;
                }
                else updates[1][fid] = w;
                UpdaterFace.addFaceToModel(chunk, fid, w);
            }
            else { // remove face
                if (updates[1].hasOwnProperty(fid)) delete updates[1][fid];
                else updates[0][fid] = null;
                UpdaterFace.removeFaceFromModel(chunk, fid);
            }
        }
    }

    /**
     * @deprecated
     */
    static updateFacesOnBoundary(chunk, x, y, z, isAddition)
    {
        const capacity = chunk.capacity;
        const dimensions = chunk.dimensions;

        let updatedChunks = new Set();

        if (x === dimensions[0] - 1) {
            let wOrigin = chunk.what(x, y, z);
            let w = chunk.neighbourWhat(x + 1, y, z);
            if (!isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            let fid = chunk._toId(x, y, z);
            UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
        }

        if (y === dimensions[1] - 1) {
            let wOrigin = chunk.what(x, y, z);
            let w = chunk.neighbourWhat(x, y + 1, z);
            if (!isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            let fid = capacity + chunk._toId(x, y, z);
            UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
        }

        if (z === dimensions[2] - 1) {
            let wOrigin = chunk.what(x, y, z);
            let w = chunk.neighbourWhat(x, y, z + 1);
            if (!isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            let fid = 2 * capacity + chunk._toId(x, y, z);
            UpdaterFace.updateFace(w, wOrigin, fid, chunk, isAddition);
        }

        if (x === 0) {
            let c = chunk.getNeighbourChunkFromRelativeCoordinates(x - 1, y, z);
            let newX = chunk.dimensions[0] - 1;
            let fid = c._toId(newX, y, z);
            let wOrigin = chunk.what(x, y, z);
            let w = c.what(newX, y, z);
            if (isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            UpdaterFace.updateFace(w, wOrigin, fid, c, isAddition);
            updatedChunks.add(c);
        }

        if (y === 0) {
            let c = chunk.getNeighbourChunkFromRelativeCoordinates(x, y - 1, z);
            let newY = chunk.dimensions[1] - 1;
            let fid = capacity + c._toId(x, newY, z);
            let wOrigin = chunk.what(x, y, z);
            let w = c.what(x, newY, z);
            if (isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            UpdaterFace.updateFace(w, wOrigin, fid, c, isAddition);
            updatedChunks.add(c);
        }

        if (z === 0) {
            let c = chunk.getNeighbourChunkFromRelativeCoordinates(x, y, z - 1);
            let newZ = chunk.dimensions[2] - 1;
            let fid = 2 * capacity + c._toId(x, y, newZ);
            let wOrigin = chunk.what(x, y, z);
            let w = c.what(x, y, newZ);
            if (isAddition) {
                w *= -1;
                wOrigin *= -1;
            }
            UpdaterFace.updateFace(w, wOrigin, fid, c, isAddition);
            updatedChunks.add(c);
        }

        return updatedChunks;
    }

    /**
     * @deprecated
     */
    static updateSurfaceFacesAfterDeletion(chunk, id, x, y, z) {
        let dimensions = chunk.dimensions;

        // Compute concerned faces.
        let addedFaces = [
            false, // x-
            false, // x+
            false, // y-
            false, // y+
            false, // z-
            false  // z+
        ];

        // Works with water because the new block is air.
        if (x > 0 && chunk.contains(x - 1, y, z)) addedFaces[0] = true;
        if (x < dimensions[0] - 1 && chunk.contains(x + 1, y, z)) addedFaces[1] = true;
        if (y > 0 && chunk.contains(x, y - 1, z)) addedFaces[2] = true;
        if (y < dimensions[1] - 1 && chunk.contains(x, y + 1, z)) addedFaces[3] = true;
        if (z > 0 && chunk.contains(x, y, z - 1)) addedFaces[4] = true;
        if (z < dimensions[2] - 1 && chunk.contains(x, y, z + 1)) addedFaces[5] = true;

        let removedFaces = [
            !addedFaces[0] && x > 0,             // x-
            !addedFaces[1] && x < dimensions[0] - 1, // x+
            !addedFaces[2] && y > 0,             // y-
            !addedFaces[3] && y < dimensions[1] - 1, // y+
            !addedFaces[4] && z > 0,             // z-
            !addedFaces[5] && z < dimensions[2] - 1  // z+
        ];

        UpdaterFace.rawUpdateAfterEdition(
            chunk, id, x, y, z, addedFaces, removedFaces, false, false
        );

        if (UpdaterFace.detectTopologyChangeAfterDeletion(chunk, id, x, y, z))
        // N.B. the provided criterion gives an immediate, exact answer to the topology request.
            UpdaterFace.mergeComponents(chunk, id, x, y, z);

        // Boundaries: topology-preserving updates
        return UpdaterFace.updateFacesOnBoundary(chunk, x, y, z, false);
    }

    /**
     * Never implemented.
     * @deprecated
     */
    static mergeComponents(/*chunk, id, x, y, z*/) {
        // TODO deletion version (much easier)
        // Beware of !components in client.
    }
}

export default UpdaterFace;
