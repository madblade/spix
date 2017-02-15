/**
 * Camera wrapper.
 */

'use strict';

App.Engine.Graphics.Camera = function(fov, aspect, nearPlane, farPlane, worldId) {

    // Wrap for primitive manipulation simplicity.
    var camera = new THREE.PerspectiveCamera(fov, aspect, nearPlane, farPlane);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    var pitch = new THREE.Object3D();
    var yaw = new THREE.Object3D();
    pitch.add(camera);
    yaw.add(pitch);

    // 4D logic
    this.rotTransform = [0, 0, 0];
    this.posTransform = [0, 0, 0];
    this.cameraId = null;
    this.worldId = worldId;

    // Don't expose these internal variables.
    this.yaw = yaw;                 // Top-level    (rotation.z, position)
    this.pitch = pitch;             // Intermediate (rotation.x)
    this.cameraObject = camera;     // Explicit     (constant)
};

extend(App.Engine.Graphics.Camera.prototype, {

    setCameraId: function(cameraId) {
        this.cameraId = cameraId;
    },

    getCameraId: function() {
        return this.cameraId;
    },
    
    setWorldId: function(worldId) {
        this.worldId = worldId;  
    },
    
    getWorldId: function() {
        return this.worldId;
    },

    getRecorder: function() {
        return this.cameraObject;
    },

    get3DObject: function() {
        return this.yaw;
    },

    getCameraPosition: function() {
        return this.yaw.position;
    },

    rotateX: function(deltaX) {
        var pitch = this.pitch;
        pitch.rotation.x += deltaX;
        pitch.rotation.x = Math.max(0, Math.min(Math.PI, pitch.rotation.x));
    },

    rotateZ: function(deltaZ) {
        var yaw = this.yaw;
        yaw.rotation.z += deltaZ;
    },

    getXRotation: function() {
        return this.pitch.rotation.x;
    },

    setXRotation: function(rotationX) {
        this.pitch.rotation.x = rotationX;
    },

    getZRotation: function() {
        return this.yaw.rotation.z;
    },

    setZRotation: function(rotationZ) {
        this.yaw.rotation.z = rotationZ;
    },

    setCameraPosition: function(x, y, z) {
        var yaw = this.yaw;
        yaw.position.x = x;
        yaw.position.y = y;
        yaw.position.z = z;
    },
    
    setTransform: function(rot, pos) {
        this.rotTransform = rot;
        this.posTransform = pos;
    },

    setFirstPerson: function() {
        this.cameraObject.position.z = 0;
    },

    setThirdPerson: function() {
        this.cameraObject.position.z = 4;
    }

});
