/**
 * Transform and operate chunks.
 */

'use strict';

class Updater {

    constructor(topologyEngine) {
        this._worldModel = topologyEngine.worldModel;
    }

    update(bufferInput) {
        let worldModel = this._worldModel;

        bufferInput.forEach(input => {
            let meta = input[0];
            let avatar = input[1];

            let action = meta[0];

            // Manage block addition.
            if (action === "add") {
                worldModel.addBlock(avatar, meta[1], meta[2], meta[3], meta[4]);
            } else if (action === "del") {
                worldModel.delBlock(avatar, meta[1], meta[2], meta[3]);
            }
        });
    }

}

export default Updater;
