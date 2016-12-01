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

App.Engine.Graphics.prototype.positionCameraBehind = function(cameraWrapper, vector) {
    cameraWrapper.position.x = vector[0];
    cameraWrapper.position.y = vector[1]; // + 10;
    cameraWrapper.position.z = vector[2] + 1.6;
};
