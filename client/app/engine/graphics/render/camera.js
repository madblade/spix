/**
 * Camera wrapper.
 */

'use strict';

import extend from '../../../extend.js';
import { Object3D, PerspectiveCamera } from 'three';

let Camera = function(fov, aspect, nearPlane, farPlane, worldId)
{
    // Wrap for primitive manipulation simplicity.
    let camera = new PerspectiveCamera(fov, aspect, nearPlane, farPlane);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    let pitch = new Object3D();
    let yaw = new Object3D();
    let up = new Object3D();
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
        // TODO use local transform

        let up = this.up;
        up.rotation.x = x;
        up.rotation.y = y;
        up.rotation.z = z;
    },

    getXRotation() {
        return this.pitch.rotation.x;
    },

    setXRotation(rotationX) {
        // TODO use local transform

        this.pitch.rotation.x = rotationX;
    },

    getZRotation() {
        return this.yaw.rotation.z;
    },

    setZRotation(rotationZ) {
        // TODO use local transform

        this.yaw.rotation.z = rotationZ;
    },

    copyCameraPosition(otherCamera) {
        // TODO [CRIT] maybe apply local transform here?

        if (otherCamera) {
            let up = this.up.position;
            let oup = otherCamera.getCameraPosition();
            up.x = oup.x;
            up.y = oup.y;
            up.z = oup.z;
        }
    },

    copyCameraUpRotation(otherCamera) {
        // TODO [CRIT] maybe use local transform here?

        if (otherCamera) {
            let ur = this.up.rotation;
            let our = otherCamera.getUpRotation();
            ur.x = our.x;
            ur.y = our.y;
            ur.z = our.z;
        }
    },

    setCameraPosition(x, y, z) {
        // TODO [CRIT] maybe use local transform here?

        let up = this.up;

        let sin = Math.sin;
        let cos = Math.cos;
        let PI = Math.PI;
        let rup = this.get3DObject().rotation;
        let theta0 = rup.z + PI;
        let theta1 = rup.x;
        let f = 0.7999;
        // Formula works for 4 out of 6 faces...
        let upVector = [
            -f * sin(theta1) * sin(theta0),
            f * sin(theta1) * cos(theta0),
            f * cos(theta1)
        ];

        up.position.x = x + upVector[0];
        up.position.y = y + upVector[1];
        up.position.z = z + upVector[2];
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
