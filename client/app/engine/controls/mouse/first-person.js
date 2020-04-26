/**
 *
 */

'use strict';

let FirstPersonModule = {

    onMouseMove(event) {
        if (!this.threeControlsEnabled) return;
        let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        //let rotation = graphics.cameraManager.moveCameraFromMouse(movementX, movementY);

        this.app.engine.graphics.cameraManager.addCameraRotationEvent(movementX, movementY, 0, 0);
    },

    unregisterMouseMove() {
        document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    },

    registerMouseMove() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    },

    // getFirstPersonMouseControls() {
    //     let graphics = this.app.engine.graphics;
    //
    //     let scope = this;
    //     let onMouseMove = function(event) {
    //         if (!scope.threeControlsEnabled) return;
    //         let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    //         let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    //
    //         //let rotation = graphics.cameraManager.moveCameraFromMouse(movementX, movementY);
    //
    //         graphics.cameraManager.addCameraRotationEvent(movementX, movementY, 0, 0);
    //     };
    //
    //     return {
    //         stopListeners() { document.removeEventListener('mousemove', onMouseMove, false); },
    //         startListeners() { document.addEventListener('mousemove', onMouseMove, false); }
    //     };
    // }

};

export { FirstPersonModule };
