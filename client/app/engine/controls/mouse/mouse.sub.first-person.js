/**
 *
 */

'use strict';

App.Engine.UI.prototype.getFirstPersonControls = function(camera) {
    var scope = this;

    var clientModel = this.app.model.client;
    var graphics = this.app.engine.graphics;

    return (function() {
        camera.rotation.set(0,0,0);
        var pitchObject = new THREE.Object3D();
        pitchObject.add(camera);

        var yawObject = new THREE.Object3D();
        yawObject.add(pitchObject);

        var onMouseMove = function (event) {
            if (!scope.threeControlsEnabled) return;
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            graphics.moveCameraFromMouse(movementX, movementY, yawObject, pitchObject);

            clientModel.triggerEvent('r', [yawObject.rotation.z, pitchObject.rotation.x]);
        };

        return {
            stopListeners : function () { document.removeEventListener('mousemove', onMouseMove, false); },
            startListeners : function() { document.addEventListener('mousemove', onMouseMove, false); },
            getObject : function () {
                return yawObject;
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
