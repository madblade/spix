/**
 *
 */

'use strict';

App.Engine.UI.prototype.getFirstPersonControls = function(camera, raycasterCamera) {
    var scope = this;

    var clientModel = this.app.model.client;
    var graphics = this.app.engine.graphics;

    return (function() {
        camera.rotation.set(0,0,0);
        raycasterCamera.rotation.set(0, 0, 0);

        var pitchObject = new THREE.Object3D();
        var pitchObjectR = new THREE.Object3D();
        pitchObject.add(camera);
        pitchObjectR.add(raycasterCamera);

        var yawObject = new THREE.Object3D();
        var yawObjectR = new THREE.Object3D();
        yawObject.add(pitchObject);
        yawObjectR.add(pitchObjectR);

        var onMouseMove = function (event) {
            if (!scope.threeControlsEnabled) return;
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            // TODO [CRIT] worldify and decouple.
            graphics.cameraManager.moveCameraFromMouse(movementX, movementY, yawObject, pitchObject);
            graphics.cameraManager.moveCameraFromMouse(movementX, movementY, yawObjectR, pitchObjectR);

            clientModel.triggerEvent('r', [yawObject.rotation.z, pitchObject.rotation.x]);
        };

        return {
            stopListeners : function () { document.removeEventListener('mousemove', onMouseMove, false); },
            startListeners : function() { document.addEventListener('mousemove', onMouseMove, false); },
            getObject : function () {
                return [yawObject, yawObjectR];
                // return camera;
            },
            getDirection : function () {
                // assumes the camera itself is not rotated
                var direction = new THREE.Vector3(0, 0, -1);
                var rotation = new THREE.Euler(0, 0, 0, "XYZ");

                return function (v) {
                    rotation.set(pitchObject.rotation.x, yawObject.rotation.z, 0);
                    v.copy(direction).applyEuler(rotation);
                    return v;
                };
            }()
        };
    })();
};
