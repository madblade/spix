/**
 *
 */

'use strict';

App.Engine.UI.prototype.getFirstPersonControls = function(camera) {
    var scope = this;
    var ce = this.app.connectionEngine;

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
            yawObject.rotation.z -= movementX * 0.002;
            pitchObject.rotation.x -= movementY * 0.002;
            pitchObject.rotation.x = Math.max(0, Math.min(Math.PI, pitchObject.rotation.x));

            // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
            // camera.quaternion.multiply(tmpQuaternion);
            // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);

            var x = pitchObject.rotation.x;
            var y = 0;
            var z = yawObject.rotation.z;

            ce.send('r', [z, x]);
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
