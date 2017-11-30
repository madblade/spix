/**
 * Camera wrapper.
 */

'use strict';

import * as THREE from 'three';
import extend from '../../../extend.js';

let Camera = function(fov, aspect, nearPlane, farPlane, worldId)
{
    // Wrap for primitive manipulation simplicity.
    let camera = new THREE.PerspectiveCamera(fov, aspect, nearPlane, farPlane);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    let pitch = new THREE.Object3D();
    let yaw = new THREE.Object3D();
    let up = new THREE.Object3D();
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

    setCameraId(cameraId) {
        this.cameraId = cameraId;
    },

    getCameraId() {
        return this.cameraId;
    },

    setWorldId(worldId) {
        this.worldId = worldId;
    },

    getWorldId() {
        return this.worldId;
    },

    getRecorder() {
        return this.cameraObject;
    },

    get3DObject() {
        return this.up;
    },

    getCameraPosition() {
        return this.up.position;
    },

    getUpRotation() {
        return this.up.rotation;
    },

    rotateX(deltaX) {
        let pitch = this.pitch;
        pitch.rotation.x += deltaX;
        pitch.rotation.x = Math.max(0, Math.min(Math.PI, pitch.rotation.x));
    },

    rotateZ(deltaZ) {
        let yaw = this.yaw;
        yaw.rotation.z += deltaZ;
    },

    setUpRotation(x, y, z) {
        let up = this.up;
        up.rotation.x = x;
        up.rotation.y = y;
        up.rotation.z = z;
    },

    getXRotation() {
        return this.pitch.rotation.x;
    },

    setXRotation(rotationX) {
        this.pitch.rotation.x = rotationX;
    },

    getZRotation() {
        return this.yaw.rotation.z;
    },

    setZRotation(rotationZ) {
        this.yaw.rotation.z = rotationZ;
    },

    copyCameraPosition(otherCamera) {
        if (otherCamera) {
            let up = this.up.position;
            let oup = otherCamera.getCameraPosition();
            up.x = oup.x;
            up.y = oup.y;
            up.z = oup.z;
        }
    },

    copyCameraUpRotation(otherCamera) {
        if (otherCamera) {
            let ur = this.up.rotation;
            let our = otherCamera.getUpRotation();
            ur.x = our.x;
            ur.y = our.y;
            ur.z = our.z;
        }
    },

    setCameraPosition(x, y, z) {
        let up = this.up;
        up.position.x = x;
        up.position.y = y;
        up.position.z = z - .7999;
    },

    setScreen(screen) {
        if (screen) this.screen = screen;
    },

    getScreen() {
        return this.screen; // || (function() {throw Error('Screen ' + this.getCameraId + ' undefined')})();
    },

    setCameraTransform(cameraTransform) {
        this.cameraTransform = cameraTransform;
    },

    getCameraTransform() {
        return this.cameraTransform;
    },

    setFirstPerson() {
        this.cameraObject.position.z = 0;
    },

    setThirdPerson() {
        let p = this.cameraObject.position;
        p.x = 0;
        p.y = 0;
        p.z = 4;
    }

});

export { Camera };