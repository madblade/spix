/**
 *
 */

'use strict';

let FirstPersonModule = {

    onMouseMove(event)
    {
        if (!this.threeControlsEnabled) return;
        let movementX = event.movementX ||
            event.mozMovementX ||
            event.webkitMovementX || 0;
        let movementY = event.movementY ||
            event.mozMovementY ||
            event.webkitMovementY || 0;

        //let rotation = graphics.cameraManager.moveCameraFromMouse(movementX, movementY);

        let cameraManager = this.app.engine.graphics.cameraManager;
        cameraManager.addCameraRotationEvent(
            movementX, movementY, 0, 0
        );
    },

    unregisterMouseMove()
    {
        document.removeEventListener(
            'mousemove',
            this.onMouseMove.bind(this),
            false
        );
    },

    registerMouseMove()
    {
        document.addEventListener(
            'mousemove',
            this.onMouseMove.bind(this),
            false
        );
    },

};

export { FirstPersonModule };
