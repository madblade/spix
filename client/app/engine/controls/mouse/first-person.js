/**
 *
 */

'use strict';

let FirstPersonModule = {

    getFirstPersonControls() {
        let graphics = this.app.engine.graphics;

        let scope = this;
        let onMouseMove = function(event) {
            if (!scope.threeControlsEnabled) return;
            let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            // TODO [MEDIUM] differentiate controls type in graphics

            //let rotation = graphics.cameraManager.moveCameraFromMouse(movementX, movementY);
            // TODO [CRIT] 3Dize

            graphics.cameraManager.addCameraRotationEvent(movementX, movementY, 0, 0);
        };

        return {
            stopListeners() { document.removeEventListener('mousemove', onMouseMove, false); },
            startListeners() { document.addEventListener('mousemove', onMouseMove, false); }
            /*
             , getDirection() {
             // assumes the camera itself is not rotated
             let direction = new THREE.Vector3(0, 0, -1);
             let rotation = new THREE.Euler(0, 0, 0, "XYZ");
             return function (v) {
             rotation.set(pitchObject.rotation.x, yawObject.rotation.z, 0);
             v.copy(direction).applyEuler(rotation);
             return v;
             };
             }()
             */
        };
    }

};

export { FirstPersonModule };
