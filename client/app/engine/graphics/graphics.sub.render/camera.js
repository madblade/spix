/**
 * Camera management.
 */

'use strict';

App.Engine.Graphics.CameraManager = function(graphicsEngine) {
    this.graphicsEngine = graphicsEngine;

    // Camera properties.
    this.mainFOV = 90;
    this.mainAspect = window.innerWidth / window.innerHeight;
    this.mainNear = 0.0001;
    this.mainFar = 100000;

    // Cameras.
    this.mainCamera = this.createCamera(false);
    this.subCameras = new Map();

    this.mainRaycasterCamera = this.createCamera(true);
    this.raycaster = this.createRaycaster();

    // Wrappers.
    this.mainWrapper = this.createWrapper(this.mainCamera);
    this.raycasterWrapper = this.createWrapper(this.mainRaycasterCamera);
    this.subWrappers = new Map();
};

// Factory.

App.Engine.Graphics.CameraManager.prototype.createCamera = function(forRaycaster) {
    var near = forRaycaster ? 1 : this.mainNear; // W. T. F.
    var camera = new THREE.PerspectiveCamera(this.mainFOV, this.mainAspect, near, this.mainFar);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    return camera;
};

App.Engine.Graphics.CameraManager.prototype.addCamera = function(cameraId, cameraAspect, cameraPosition) {
    if (this.subCameras.has(cameraId)) {
        console.log('Camera ' + cameraId + ' cannot be added a second time.');
        return;
    }

    var camera = new THREE.PerspectiveCamera(this.mainFOV, this.mainAspect, this.mainNear, this.mainFar);
    var p = cameraPosition;
    this.subCameras.set(cameraId, camera);
    var wrapper = this.createSubWrapper(cameraId);
    var yaw = wrapper[1];
    // TODO [CRIT] init camera position, rotation
    yaw.position.set(p[0], p[1], p[2]+1);
};

App.Engine.Graphics.CameraManager.prototype.addWrapperToScene = function(cameraId, worldId) {
    var wrapper = this.subWrappers.get(cameraId);
    if (!wrapper) {
        console.log('Could not get wrapper for camera ' + cameraId);
        return;
    }

    this.graphicsEngine.addToScene(wrapper[1], worldId);
};

App.Engine.Graphics.CameraManager.prototype.createWrapper = function(camera) {
    camera.rotation.set(0, 0, 0);
    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);
    var yawObject = new THREE.Object3D();
    yawObject.add(pitchObject);
    return [pitchObject, yawObject];
};

App.Engine.Graphics.CameraManager.prototype.createSubWrapper = function(cameraId) {
    var camera = this.subCameras.get(cameraId);
    if (!camera) {
        console.log('Could not create wrapper for camera ' + cameraId);
    }
    var wrapper = this.createWrapper(camera);
    this.subWrappers.set(cameraId, wrapper);
    return wrapper;
};

// TODO [HIGH] worldify
// TODO [MEDIUM] with raycaster
App.Engine.Graphics.CameraManager.prototype.switchToCamera = function(cameraId) {
    var newMainCamera = this.subCameras.get(cameraId);
    if (!newMainCamera) { console.log('Failed to switch with camera ' + cameraId); return; }
    var oldMainCamera = this.mainCamera;

    this.mainCamera = newMainCamera;
    this.addCamera(oldMainCamera); // TODO [HIGH] aspect, position
};

// Update.

App.Engine.Graphics.CameraManager.prototype.updateCameraPosition = function(vector) {
    var wrappers = [this.mainWrapper, this.raycasterWrapper];
    this.subWrappers.forEach(function(wrapper) { wrappers.push(wrapper); });

    var i = this.graphicsEngine.getCameraInteraction();

    if (i.isFirstPerson()) {
        wrappers.forEach(function(cam) {
            var yaw = cam[1];
            yaw.position.x = vector[0];
            yaw.position.y = vector[1]; // + 10;
            yaw.position.z = vector[2] + 1.6;
        });
    }

    else if (i.isThirdPerson()) {
        wrappers.forEach(function(cam) {
            var yaw = cam[1];
            yaw.position.x = vector[0];
            yaw.position.y = vector[1]; // + 10;
            yaw.position.z = vector[2] + 1.8;
        });
    }
};

App.Engine.Graphics.CameraManager.prototype.moveCameraFromMouse = function(movementX, movementY) {
    // Rotate main camera.
    var pitchObject = this.mainWrapper[0];
    var yawObject = this.mainWrapper[1];
    yawObject.rotation.z -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(0, Math.min(Math.PI, pitchObject.rotation.x));

    // Rotate raycaster camera.
    var pitchObjectR = this.raycasterWrapper[0];
    var yawObjectR = this.raycasterWrapper[1];
    var yz = yawObject.rotation.z;
    var px = pitchObject.rotation.x;
    yawObjectR.rotation.z = yz;
    pitchObjectR.rotation.x = px;

    // Apply transform to portals.
    this.subWrappers.forEach(function(subWrapper, cameraId) {
        // TODO [CRIT] update camera position, rotation rel. to portal position.
        var pit = subWrapper[0];
        var yaw = subWrapper[1];
        yaw.rotation.z = yz;
        pit.rotation.x = px;
    });

    // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
    // camera.quaternion.multiply(tmpQuaternion);
    // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);
    return [yz, px];
};

App.Engine.Graphics.CameraManager.prototype.resize = function(width, height) {
    // TODO [HIGH] apply to other cameras AND RENDER TARGETS (DONT FORGET).
    var aspect = width / height;

    var camera = this.mainCamera;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    var raycasterCamera = this.mainRaycasterCamera;
    raycasterCamera.aspect = aspect;
    raycasterCamera.updateProjectionMatrix();
};

// Raycasting.

App.Engine.Graphics.CameraManager.prototype.createRaycaster = function() {
    return new THREE.Raycaster();
};

App.Engine.Graphics.CameraManager.prototype.performRaycast = function() {
    var graphicsEngine = this.graphicsEngine;
    var chunkModel = graphicsEngine.app.model.server.chunkModel;
    var selfModel = graphicsEngine.app.model.server.selfModel;

    var raycaster = this.raycaster;
    var camera = this.mainRaycasterCamera;
    var terrain = chunkModel.getCloseTerrain(selfModel.worldId);

    var intersects;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    intersects = raycaster.intersectObjects(terrain);

    return intersects;
};

/** Interface with graphics engine. **/

App.Engine.Graphics.prototype.createCameraManager = function() {
    return new App.Engine.Graphics.CameraManager(this);
};

App.Engine.Graphics.prototype.getCameraCoordinates = function() {
    return this.cameraManager.mainWrapper[1].position;
};
