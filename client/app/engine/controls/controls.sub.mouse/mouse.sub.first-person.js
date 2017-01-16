/**
 *
 */

'use strict';

App.Engine.UI.prototype.getFirstPersonControls = function() {
    var clientModel = this.app.model.client;
    var graphics = this.app.engine.graphics;

    var scope = this;
    var onMouseMove = function(event) {
        if (!scope.threeControlsEnabled) return;
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // TODO [MEDIUM] differentiate controls type in graphics
        var rotation = graphics.cameraManager.moveCameraFromMouse(movementX, movementY);

        clientModel.triggerEvent('r', [rotation[0], rotation[1]]);
    };

    return {
        stopListeners : function () { document.removeEventListener('mousemove', onMouseMove, false); },
        startListeners : function() { document.addEventListener('mousemove', onMouseMove, false); }
        /*
         , getDirection : function () {
         // assumes the camera itself is not rotated
             var direction = new THREE.Vector3(0, 0, -1);
             var rotation = new THREE.Euler(0, 0, 0, "XYZ");
             return function (v) {
                 rotation.set(pitchObject.rotation.x, yawObject.rotation.z, 0);
                 v.copy(direction).applyEuler(rotation);
                return v;
             };
         }()
         */
    };
};
