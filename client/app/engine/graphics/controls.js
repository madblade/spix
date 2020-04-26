/**
 *
 */

'use strict';

let ControlsModule = {

    // initializeControls() {
    //     let controlsEngine = this.app.engine.controls;
    //     let selfModel = this.app.model.server.selfModel;
    //     let worldId = selfModel.worldId;
    //
    //     this.controls = controlsEngine.getControls('first-person');
    //
    //     this.addToScene(this.cameraManager.mainCamera.get3DObject(), worldId);
    //     this.addToScene(this.cameraManager.mainRaycasterCamera.get3DObject(), worldId);
    // },
    //
    // startListeners() {
    //     this.controls.startListeners();
    // },
    //
    // stopListeners() {
    //     this.controls.stopListeners();
    // },

    changeAvatarVisibility(display, avatar, worldId) {
        if (display)
            this.addToScene(avatar, worldId);
        else
            this.removeFromScene(avatar, worldId);
    }

};

export { ControlsModule };
