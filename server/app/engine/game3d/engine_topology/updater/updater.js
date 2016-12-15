/**
 * Transform and operate chunks.
 */

'use strict';

import UpdateAPI from './updateapi';

class Updater {

    constructor(topologyEngine) {
        this._worldModel  = topologyEngine.worldModel;
        this._entityModel = topologyEngine.entityModel;
        this._accessor    = topologyEngine.accessor;
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

        UpdateAPI.addBlock(avatar, x, y, z, blockId, this._worldModel, this._entityModel, this._accessor);
    }

    delBlock(avatar, x, y, z) {

        UpdateAPI.delBlock(avatar, x, y, z, this._worldModel, this._entityModel, this._accessor);
    }

}

export default Updater;
