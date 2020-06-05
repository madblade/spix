/**
 * Transform and operate chunks.
 */

'use strict';

import UpdaterAccess from './updater_access';
import UpdaterBlock from './updater_block';
import UpdaterFace from './updater_face';
import { BlockTypes } from '../../model_world/model';

class Updater
{
    constructor(topologyEngine)
    {
        // Models.
        this._worldModel   = topologyEngine.worldModel;
        this._entityModel  = topologyEngine.entityModel;

        this._outputBuffer = topologyEngine.outputBuffer;
    }

    update(inputBuffer)
    {
        inputBuffer.forEach(input => {
            let data = input[0];
            let avatar = input[1];
            let worldId = avatar.worldId;
            if (!worldId) return; // Avatar was disconnected between input & update.

            let meta = data.meta;
            let action = meta[0];

            // Manage block addition.
            if (action === 'add') {
                let blockId = meta[4];
                if (this.isValidBlock(blockId))
                {
                    const x = parseInt(meta[1], 10);
                    const y = parseInt(meta[2], 10);
                    const z = parseInt(meta[3], 10);
                    const bid = parseInt(blockId, 10);
                    this.addBlock(avatar, x, y, z, bid);
                }
            } else if (action === 'del') {
                const x = parseInt(meta[1], 10);
                const y = parseInt(meta[2], 10);
                const z = parseInt(meta[3], 10);
                this.delBlock(avatar, x, y, z);
            }
        });
    }

    isValidBlock(blockId)
    {
        let isBlock =
            typeof blockId === 'number' &&
            BlockTypes.isBlock(blockId);
        if (!isBlock) {
            console.warn('[TopoEngine/Updater] Block not managed. ' +
                'See BlockTypes and ItemType.');
        }
        return isBlock;
    }

    addBlock(avatar, x, y, z, blockId)
    {
        let worldId = avatar.worldId;
        let world = this._worldModel.getWorld(worldId);
        let o = this._outputBuffer;
        let em = this._entityModel;

        let a = UpdaterAccess.requestAddBlock(avatar, x, y, z, world, em);
        if (!a) return;

        let $chunk; let $x; let $y; let $z;
        [$chunk, $x, $y, $z] = a;

        let $id = $chunk.add($x, $y, $z, blockId);
        const status = UpdaterBlock.updateSurfaceBlocksAfterAddition($chunk, $id, $x, $y, $z, blockId);
        if (!status) {
            console.warn('[Updater] Addition: blocks not ready.');
            return;
        }
        let updatedChunks = UpdaterFace.updateSurfaceFacesAfterAddition2($chunk, $id, $x, $y, $z, blockId);
        if (!updatedChunks) {
            return;
        }

        // Push updates.
        updatedChunks.forEach(c => o.chunkUpdated(worldId, c.chunkId));
        o.chunkUpdated(worldId, $chunk.chunkId);
    }

    delBlock(avatar, x, y, z)
    {
        let worldId = avatar.worldId;
        let world = this._worldModel.getWorld(worldId);
        let o = this._outputBuffer;
        let em = this._entityModel;

        let a = UpdaterAccess.requestDelBlock(avatar, x, y, z, world, em);
        if (!a) return;

        let $chunk; let $x; let $y; let $z;
        [$chunk, $x, $y, $z] = a;

        let oldBlock = $chunk.what($x, $y, $z);
        let $id = $chunk.del($x, $y, $z);
        const status = UpdaterBlock.updateSurfaceBlocksAfterDeletion($chunk, $id, $x, $y, $z);
        if (!status) {
            console.warn('[Updater] Deletion: blocks not ready.');
            return;
        }

        let updatedChunks = UpdaterFace.updateSurfaceFacesAfterDeletion2($chunk, $id, $x, $y, $z, oldBlock);
        if (!updatedChunks) {
            return;
        }

        // Push updates.
        updatedChunks.forEach(c => o.chunkUpdated(worldId, c.chunkId));
        o.chunkUpdated(worldId, $chunk.chunkId);
    }
}

export default Updater;
