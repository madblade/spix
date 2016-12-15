/**
 * Transform and operate chunks.
 */

'use strict';

import UpdateAPI from './updateapi';
import BlockUpdater from './blockupdater';
import FaceUpdater from './faceupdater';

class Updater {

    constructor(topologyEngine) {
        this._worldModel   = topologyEngine.worldModel;
        this._entityModel  = topologyEngine.entityModel;
        this._accessor     = topologyEngine.accessor;

        this._outputBuffer = topologyEngine.outputBuffer;
    }

    update(bufferInput) {
        bufferInput.forEach(input => {
            let meta = input[0];
            let avatar = input[1];

            let action = meta[0];

            // Manage block addition.
            if (action === "add") {
                this.addBlock(avatar, meta[1], meta[2], meta[3], meta[4]);
            } else if (action === "del") {
                this.delBlock(avatar, meta[1], meta[2], meta[3]);
            }
        });
    }

    addBlock(avatar, x, y, z, blockId) {
        let w = this._worldModel;
        let o = this._outputBuffer;

        let a = UpdateAPI.addBlock(avatar, x, y, z, blockId, w, this._entityModel, this._accessor);
        if (!a) return;

        let $chunk, $x, $y, $z, $blockId;
        [$chunk, $x, $y, $z, $blockId] = a;

        let $id = $chunk.add($x, $y, $z, $blockId);
        BlockUpdater.updateSurfaceBlocksAfterAddition($chunk, $id, $x, $y, $z);
        let updatedChunks = FaceUpdater.updateSurfaceFacesAfterAddition($chunk, $id, $x, $y, $z);

        // Push updates.
        updatedChunks.forEach(c => o.chunkUpdated(c.chunkId));
        o.chunkUpdated($chunk.chunkId);
    }

    delBlock(avatar, x, y, z) {
        let w = this._worldModel;
        let o = this._outputBuffer;

        let a = UpdateAPI.delBlock(avatar, x, y, z, w, this._entityModel, this._accessor);
        if (!a) return;

        let $chunk, $x, $y, $z;
        [$chunk, $x, $y, $z] = a;

        let $id = $chunk.del($x, $y, $z);
        BlockUpdater.updateSurfaceBlocksAfterDeletion($chunk, $id, $x, $y, $z);
        let updatedChunks = FaceUpdater.updateSurfaceFacesAfterDeletion($chunk, $id, $x, $y, $z);

        // Push updates.
        updatedChunks.forEach(c => o.chunkUpdated(c.chunkId));
        o.chunkUpdated($chunk.chunkId);
    }

}

export default Updater;
