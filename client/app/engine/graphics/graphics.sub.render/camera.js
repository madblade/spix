/**
 * Camera management.
 */

'use strict';

App.Engine.Graphics.CameraManager = function(graphicsEngine) {
    this.graphicsEngine = graphicsEngine;

    this.mainCamera = this.createCamera();
    this.subCameras = new Map();

    this.raycaster = this.createRaycaster();
};

App.Engine.Graphics.CameraManager.prototype.createCamera = function() {
    var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.0001, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    return camera;
};

App.Engine.Graphics.CameraManager.prototype.addCamera = function() {
    // TODO [CRIT] compute new Id & dev model for knots.
    this.subCameras.set(1000, this.createCamera());
};

App.Engine.Graphics.CameraManager.prototype.switchToCamera = function(cameraId) {
    var newMainCamera = this.subCameras.get(cameraId);
    if (!newMainCamera) { console.log('Failed to switch with camera ' + cameraId); return; }
    var oldMainCamera = this.mainCamera;

    this.mainCamera = newMainCamera;
    this.addCamera(oldMainCamera);
};

App.Engine.Graphics.CameraManager.prototype.positionCameraBehind = function(vector) {
    var cameraWrapper = this.graphicsEngine.controls.getObject();
    var i = this.graphicsEngine.interaction;

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

App.Engine.Graphics.CameraManager.prototype.moveCameraFromMouse = function(movementX, movementY, yawObject, pitchObject) {
    yawObject.rotation.z -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(0, Math.min(Math.PI, pitchObject.rotation.x));

    // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
    // camera.quaternion.multiply(tmpQuaternion);
    // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);
};

App.Engine.Graphics.CameraManager.prototype.resize = function(width, height) {
    // TODO [HIGH] apply to other cameras AND RENDER TARGETS (DONT FORGET).
    var camera = this.mainCamera;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
};

// Raycasting

App.Engine.Graphics.CameraManager.prototype.createRaycaster = function() {
    return new THREE.Raycaster();
};

App.Engine.Graphics.CameraManager.prototype.performRaycast = function() {
    var graphicsEngine = this.graphicsEngine;
    var chunkModel = graphicsEngine.app.model.server.chunkModel;
    var selfModel = graphicsEngine.app.model.server.selfModel;

    var raycaster = this.raycaster;
    var camera = this.mainCamera;
    var terrain = chunkModel.getCloseTerrain(selfModel.worldId);

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    return raycaster.intersectObjects(terrain, true);
};

/** Interface with graphics engine. **/

App.Engine.Graphics.prototype.createCameraManager = function() {
    return new App.Engine.Graphics.CameraManager(this);
};
