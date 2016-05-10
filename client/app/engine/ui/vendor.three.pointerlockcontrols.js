/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function (camera) {

    var scope = this;

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(pitchObject);

    var PI_2 = Math.PI / 2;

    var onMouseMove = function (event) {
        if (scope.enabled === false) return;
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;
        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
    };

    this.dispose = function () {
        document.removeEventListener('mousemove', onMouseMove, false);
    };
    document.addEventListener('mousemove', onMouseMove, false);
    this.enabled = false;

    this.getObject = function () {
        return yawObject;
    };

    this.getDirection = function () {
        // assumes the camera itself is not rotated
        var direction = new THREE.Vector3(0, 0, -1);
        var rotation = new THREE.Euler(0, 0, 0, "YXZ");

        return function (v) {
            rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0);
            v.copy(direction).applyEuler(rotation);
            return v;
        };

    }();
};

var pointerModule = (function () {
    var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if (havePointerLock) {
        var element = document.body;

        var pointerlockerror = function (event) {
            console.log('Pointer lock error :/');
        };

        var pointerlockchange = function (event) {
            app.graphicsEngine.controls.enabled =
                (document.pointerLockElement === element ||
                document.mozPointerLockElement === element ||
                document.webkitPointerLockElement === element);
        };

        // Hook pointer lock state change events
        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener('mozpointerlockchange', pointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener('mozpointerlockerror', pointerlockerror, false);
        document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

        $(document).mousedown( function (event) {
            event.preventDefault();
            switch (event.which) {
                case 1: // Left
                case 2: // Middle
                    return;
                case 3:
                default: // Right
            }

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock || element.webkitRequestPointerLock;

            if (/Firefox/i.test(navigator.userAgent)) {
                var fullscreenchange = function (event) {
                    if (!(document.fullscreenElement === element || document.mozFullscreenElement === element ||
                        document.mozFullScreenElement === element)) return;

                    document.removeEventListener('fullscreenchange', fullscreenchange);
                    document.removeEventListener('mozfullscreenchange', fullscreenchange);
                    element.requestPointerLock();
                };

                document.addEventListener('fullscreenchange', fullscreenchange, false);
                document.addEventListener('mozfullscreenchange', fullscreenchange, false);
                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen ||
                    element.mozRequestFullScreen || element.webkitRequestFullscreen;

                element.requestFullscreen();
            } else {
                element.requestPointerLock();
            }

        });

    } else {
        console.log('ERROR: POINTER LOCK NOT SUPPORTED.');
    }

    return {};
})();
