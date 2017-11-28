/**
 * Camera wrapper.
 */

'use strict';

import * as THREE from 'three';
import extend from '../../../extend.js';

var Camera = function(fov, aspect, nearPlane, farPlane, worldId)
{
    // Wrap for primitive manipulation simplicity.
    var camera = new THREE.PerspectiveCamera(fov, aspect, nearPlane, farPlane);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    var pitch = new THREE.Object3D();
    var yaw = new THREE.Object3D();
    var up = new THREE.Object3D();
    pitch.add(camera);
    yaw.add(pitch);
    up.add(yaw);
    up.rotation.reorder('ZYX');

    // 4D logic
    this.worldId = worldId;
    this.cameraId = null;
    this.cameraTransform = [
        0, 0, 0,    // Pos transform
        0, 0, 0     // Rot transform
    ];

    // Don't expose these internal variables.
    this.up = up;                   // 3D 'gravity' constraint (full rotation)
    this.yaw = yaw;                 // Top-level    (rotation.z, position)
    this.pitch = pitch;             // Intermediate (rotation.x)
    this.cameraObject = camera;     // Explicit     (constant)

    this.screen = null;
};

extend(Camera.prototype, {

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
        return this.up;
    },

    getCameraPosition: function() {
        return this.up.position;
    },

    getUpRotation: function() {
        return this.up.rotation;
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

    setUpRotation: function(x, y, z) {
        var up = this.up;
        up.rotation.x = x;
        up.rotation.y = y;
        up.rotation.z = z;
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

    copyCameraPosition: function(otherCamera) {
        if (otherCamera) {
            var up = this.up.position;
            var oup = otherCamera.getCameraPosition();
            up.x = oup.x;
            up.y = oup.y;
            up.z = oup.z;
        }
    },

    copyCameraUpRotation: function(otherCamera) {
        if (otherCamera) {
            var ur = this.up.rotation;
            var our = otherCamera.getUpRotation();
            ur.x = our.x;
            ur.y = our.y;
            ur.z = our.z;
        }
    },

    setCameraPosition: function(x, y, z) {
        var up = this.up;
        up.position.x = x;
        up.position.y = y;
        up.position.z = z - .7999;
    },

    setScreen: function(screen) {
        if (screen) this.screen = screen;
    },

    getScreen: function() {
        return this.screen; // || (function() {throw Error('Screen ' + this.getCameraId + ' undefined')})();
    },

    setCameraTransform: function(cameraTransform) {
        this.cameraTransform = cameraTransform;
    },

    getCameraTransform: function() {
        return this.cameraTransform;
    },

    setFirstPerson: function() {
        this.cameraObject.position.z = 0;
    },

    setThirdPerson: function() {
        var p = this.cameraObject.position;
        p.x = 0;
        p.y = 0;
        p.z = 4;
    }

});

module.exports = Camera;
