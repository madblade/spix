/**
 *
 */

'use strict';

let ControlsModule = {

    changeHeldItem(itemID) {
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
