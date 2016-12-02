/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.createCamera = function() {
    var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.0001, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    return camera;
};

App.Engine.Graphics.prototype.createRaycaster = function() {
    return new THREE.Raycaster();
};

App.Engine.Graphics.prototype.positionCameraBehind = function(vector) {
    var cameraWrapper = this.controls.getObject();
    var i = this.interaction;

    if (i === 'FP') {
        cameraWrapper.position.x = vector[0];
        cameraWrapper.position.y = vector[1]; // + 10;
        cameraWrapper.position.z = vector[2] + 1.6;

    } else if (i === 'TP') {
        cameraWrapper.position.x = vector[0];
        cameraWrapper.position.y = vector[1]; // + 10;
        cameraWrapper.position.z = vector[2] + 1.8;
    }
};

App.Engine.Graphics.prototype.moveCameraFromMouse = function(movementX, movementY, yawObject, pitchObject) {
    yawObject.rotation.z -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(0, Math.min(Math.PI, pitchObject.rotation.x));

    // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
    // camera.quaternion.multiply(tmpQuaternion);
    // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);
};
