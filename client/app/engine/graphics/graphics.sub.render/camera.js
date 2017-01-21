/**
 * Camera wrapper.
 */

'use strict';

App.Engine.Graphics.Camera = function(fov, aspect, nearPlane, farPlane) {

    // Wrap for primitive manipulation simplicity.
    var camera = new THREE.PerspectiveCamera(fov, aspect, nearPlane, farPlane);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    var pitch = new THREE.Object3D();
    var yaw = new THREE.Object3D();
    pitch.add(camera);
    yaw.add(pitch);

    // Don't expose these internal variables.
    this.yaw = yaw;                 // Top-level    (rotation.z, position)
    this.pitch = pitch;             // Intermediate (rotation.x)
    this.cameraObject = camera;     // Explicit     (constant)
};

App.Engine.Graphics.Camera.prototype.getRecorder = function() {
    return this.cameraObject;
};

App.Engine.Graphics.Camera.prototype.get3DObject = function() {
    return this.yaw;
};

App.Engine.Graphics.Camera.prototype.getCameraPosition = function() {
    return this.yaw.position;
};

App.Engine.Graphics.Camera.prototype.rotateX = function(deltaX) {
    var pitch = this.pitch;
    pitch.rotation.x += deltaX;
    pitch.rotation.x = Math.max(0, Math.min(Math.PI, pitch.rotation.x));
};

App.Engine.Graphics.Camera.prototype.rotateZ = function(deltaZ) {
    var yaw = this.yaw;
    yaw.rotation.z += deltaZ;
};

App.Engine.Graphics.Camera.prototype.getXRotation = function() {
    return this.pitch.rotation.x;
};

App.Engine.Graphics.Camera.prototype.setXRotation = function(rotationX) {
    this.pitch.rotation.x = rotationX;
};

App.Engine.Graphics.Camera.prototype.getZRotation = function() {
    return this.yaw.rotation.z;
};

App.Engine.Graphics.Camera.prototype.setZRotation = function(rotationZ) {
    this.yaw.rotation.z = rotationZ;
};

App.Engine.Graphics.Camera.prototype.setCameraPosition = function(x, y, z) {
    var yaw = this.yaw;
    yaw.position.x = x;
    yaw.position.y = y;
    yaw.position.z = z;
};

App.Engine.Graphics.Camera.prototype.setFirstPerson = function() {
    this.cameraObject.position.z = 0;
};

App.Engine.Graphics.Camera.prototype.setThirdPerson = function() {
    this.cameraObject.position.z = 4;
};
