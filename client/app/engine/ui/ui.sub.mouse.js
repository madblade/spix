/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupMouse = function() {

    // Click / move handlers.
    this.setupPointerLock();
};

App.Engine.UI.prototype.updateMouse = function() {
    // Hold-click handlers.
};

App.Engine.UI.prototype.setupPointerLock = function() {
    var hasPointerLock = 'webkitPointerLockElement' in document ||
        'mozPointerLockElement' in document || 'pointerLockElement' in document;
    if (hasPointerLock) {
        var element = document.body;
        $(document).mousedown( function (event) {
            event.preventDefault();
            switch (event.which) {
                case 1: // Left
                case 2: // Middle
                    return;
                case 3:
                default: // Right
            }

            // Ask the browser to lock the pointer.
            element.requestPointerLock();
        });
    }
};

App.Engine.UI.prototype.getControls = function(controlType, camera) {
    var controls;

    if (controlType === 'first-person') {
        controls = this.getFirstPersonControls(camera);
    } else {
        // TODO handle error
        controls = undefined;
    }

    return controls;
};

App.Engine.UI.prototype.getFirstPersonControls = function(camera) {

    var scope = this;
    var PI_2 = Math.PI / 2;
    var ce = this.app.connectionEngine;
    return (function() {
        camera.rotation.set(0,0,0);
        var pitchObject = new THREE.Object3D();
        pitchObject.add(camera);

        var yawObject = new THREE.Object3D();
        yawObject.position.y = 10;
        yawObject.add(pitchObject);

        var onMouseMove = function (event) {
            if (!scope.threeControlsEnabled) return;
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            yawObject.rotation.y -= movementX * 0.002;
            pitchObject.rotation.x -= movementY * 0.002;
            pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
            ce.send('r', JSON.stringify([yawObject.rotation.y, pitchObject.rotation.x]));
        };

        document.addEventListener('mousemove', onMouseMove, false);

        return {
            dispose : function () { document.removeEventListener('mousemove', onMouseMove, false); },
            getObject : function () { return yawObject; },
            getDirection : function () {
                // assumes the camera itself is not rotated
                var direction = new THREE.Vector3(0, 0, -1);
                var rotation = new THREE.Euler(0, 0, 0, "YXZ");

                return function (v) {
                    rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0);
                    v.copy(direction).applyEuler(rotation);
                    return v;
                };
            }()
        };
    })();
};
