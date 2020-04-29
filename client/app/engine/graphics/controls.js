/**
 *
 */

'use strict';

let ControlsModule = {

    changeHeldItem(itemID) {
        // Warn! this short-circuits client-server validation.
        // TODO push item held event to server in normal loop.
        let selfModel = this.app.model.server.selfModel;
        selfModel.updateHandItem();
        console.log('changing for ' + itemID);
    },

    changeAvatarVisibility(display, avatar, worldId) {
        if (display)
            this.addToScene(avatar, worldId);
        else
            this.removeFromScene(avatar, worldId);
    }

};

export { ControlsModule };
