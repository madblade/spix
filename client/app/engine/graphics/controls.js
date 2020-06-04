/**
 *
 */

'use strict';

let ControlsModule = {

    changeHeldItem(itemID)
    {
        // Warn! this short-circuits client-server validation.
        // Consider pushing item held event to server in normal loop.
        let selfModel = this.app.model.server.selfModel;
        selfModel.updateHandItem();
        if (this._debug)
            console.log(`[Graphics/Controls] Changing for item ${itemID}.`);
    },

    changeAvatarVisibility(display, avatar, worldId)
    {
        if (display)
            this.addToScene(avatar, worldId);
        else
            this.removeFromScene(avatar, worldId);
    }

};

export { ControlsModule };
