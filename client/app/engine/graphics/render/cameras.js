/**
 * Camera management.
 */

'use strict';

import extend from '../../../extend.js';
import { Camera } from './camera.js';
import {
    Matrix4, PerspectiveCamera,
    Plane, Raycaster,
    Vector2, Vector3, Vector4,
} from 'three';
import { WaterCameraModule } from '../water/watercamera';

const DEFAULT_CAMERA = {
    fov: 90,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.0001,
    far: 100000
};

let CameraManager = function(graphicsEngine)
{
    this.graphicsEngine = graphicsEngine;

    // Camera properties.
    this.mainFOV = DEFAULT_CAMERA.fov;
    this.mainAspect = window.innerWidth / window.innerHeight;
    this.mainNear = DEFAULT_CAMERA.near;
    this.mainFar = DEFAULT_CAMERA.far;

    // Cameras.
    this.mainCamera = this.createCamera(false, -1);
    this.mainCamera.setCameraId(-1);

    // Raycast with different near plane
    this.mainRaycasterCamera = this.createCamera(true, -1);
    this.raycaster = this.createRaycaster();

    // Portals
    this.subCameras = new Map();
    this.stencilCamera = new PerspectiveCamera(
        this.mainFOV, this.mainAspect, this.mainNear, this.mainFar
    );
    this.stencilCamera.matrixAutoUpdate = false;

    // Water
    this.waterCamera = this.createWaterCamera();

    // Optimization
    this.incomingRotationEvents = [];
    this.oldTheta0 = 0;
    this.oldTheta1 = 0;
};

// Factory.

extend(CameraManager.prototype, {

    createCamera(forRaycaster, worldId)
    {
        // Resize (when window is resized on hub, portals are not affected)
        this.mainAspect = window.innerWidth / window.innerHeight;

        return new Camera(
            this.mainFOV,
            this.mainAspect,
            forRaycaster ? 1 : this.mainNear,
            this.mainFar,
            worldId);
    },

    addCamera(
        frameSource, frameDestination,
        cameraPath, cameraTransform, screen)
    {
        let cameraId = cameraPath;

        if (this.subCameras.has(cameraId))
        {
            //console.log('Camera ' + cameraId + ' cannot be added a second time.');
            console.log('[CameraManager] Skipping camera addition.');
            //let err = new Error();
            //console.log(err.stack);
            return;
        }

        let mainCamera = this.mainCamera;
        let camera = this.createCamera(false);
        camera.setCameraId(cameraId);
        camera.setCameraTransform(cameraTransform);
        if (screen) camera.setScreen(screen);
        this.subCameras.set(cameraId, camera);

        // TODO [PORTAL] manage rotation and position transform from path

        camera.copyCameraPosition(mainCamera);
        camera.copyCameraUpRotation(mainCamera);
        camera.setZRotation(mainCamera.getZRotation());
        camera.setXRotation(mainCamera.getXRotation());
    },

    addCameraToScene(cameraId, worldId, screen)
    {
        worldId = parseInt(worldId, 10);

        let camera = this.subCameras.get(cameraId);
        if (!camera && cameraId === this.mainCamera.getCameraId())
            camera = this.mainCamera;
        if (!camera) {
            console.log(`@addCamera: could not get wrapper for camera ${cameraId}`);
            return;
        }

        camera.setWorldId(worldId);
        if (screen) camera.setScreen(screen);
        this.graphicsEngine.addToScene(camera.get3DObject(), worldId);

        camera.getRecorder().updateProjectionMatrix();
        camera.getRecorder().updateMatrixWorld();
        camera.getRecorder().matrixWorldInverse
            .getInverse(camera.getRecorder().matrixWorld);
        console.log(`Successfully added side camera to scene ${worldId}`);
    },

    // removeCamera(cameraId) {
    // },

    removeCameraFromScene(cameraId, worldId)
    {
        worldId = parseInt(worldId, 10);
        let camera = this.subCameras.get(cameraId);
        if (!camera && cameraId === this.mainCamera.getCameraId())
            camera = this.mainCamera;
        if (!camera)
        {
            console.log(`@removeCamera: could not get wrapper for camera ${cameraId}.`);
            return;
        }

        if (!worldId) worldId = camera.getWorldId();

        this.graphicsEngine.removeFromScene(
            camera.get3DObject(), worldId, true
        );
    },

    switchMainCameraToWorld(oldMainSceneId, sceneId)
    {
        let mainCamera = this.mainCamera;
        let mainRaycasterCamera = this.mainRaycasterCamera;
        let graphics = this.graphicsEngine;

        graphics.removeFromScene(mainCamera.get3DObject(), oldMainSceneId);
        graphics.removeFromScene(mainRaycasterCamera.get3DObject(),
            oldMainSceneId);

        graphics.addToScene(mainCamera.get3DObject(), sceneId);
        graphics.addToScene(mainRaycasterCamera.get3DObject(), sceneId);
    },

    /** @deprecated */
    switchToCamera(oldWorldId, newWorldId)
    {
        console.log(`Deprecated call to switchToCamera ${newWorldId}.`);
    },

    // Update.
    updateCameraPosition(vector)
    {
        let sin = Math.sin;
        let cos = Math.cos;
        // let PI = Math.PI;

        let cams = [this.mainCamera, this.mainRaycasterCamera];
        this.subCameras.forEach(function(cam) { cams.push(cam); });
        let localRecorder = this.mainCamera.getRecorder();

        let i = this.graphicsEngine.getCameraInteraction();

        // TODO [PERF] switch to quaternion (also server-side)
        let up = this.mainCamera.get3DObject().rotation;
        let theta0 = up.z;
        let theta1 = up.x;
        let f = 0; // 1.6;
        let upVector = [
            f * sin(theta1) * cos(theta0), // theta0 - PI / 2),
            f * sin(theta1) * sin(theta0), // theta0 - PI / 2),
            f * cos(theta1)
        ];

        let x = vector.x + upVector[0];
        let y = vector.y + upVector[1];
        let z = vector.z + upVector[2];
        // let x = vector[0];
        // let y = vector[1];
        // let z = vector[2] + 1.6;
        //let z = vector[2];

        if (i.isFirstPerson())
        {
            cams.forEach(function(cam/*, cameraId*/) {
                // TODO [PORTAL] update differently from portal transforms.
                cam.setCameraPosition(x, y, z);
                cam.setFirstPerson();
                let mirrorCamera = cam.getRecorder();
                if (mirrorCamera) {
                    let screen = cam.getScreen();
                    if (screen) {
                        let mirror = screen.getMesh();
                        this.clipOblique(mirror, mirrorCamera, localRecorder);
                    }
                }
            }.bind(this));
        }

        else if (i.isThirdPerson())
        {
            cams.forEach(function(cam/*, cameraId*/) {
                cam.setCameraPosition(x, y, z);
                cam.setThirdPerson();
                let mirrorCamera = cam.getRecorder();
                if (mirrorCamera) {
                    let screen = cam.getScreen();
                    if (screen) {
                        let mirror = screen.getMesh();
                        this.clipOblique(mirror, mirrorCamera, localRecorder);
                    }
                }
            }.bind(this));
        }
    },

    addCameraRotationEvent(relX, relY, absX, absY)
    {
        this.incomingRotationEvents.push([relX, relY, absX, absY]);
    },

    refresh()
    {
        let incoming = this.incomingRotationEvents;
        if (incoming.length < 1) return;

        let rotation = [0, 0, 0, 0];
        for (let i = 0, l = incoming.length; i < l; ++i)
        {
            let inc = incoming[i];
            let rot = [0, 0, 0, 0];
            // TODO [PERF] put that in update received instead.
            rot = this.moveCameraFromMouse(inc[0], inc[1], inc[2], inc[3]);
            rotation[0] = rot[0];
            rotation[1] = rot[1];
            rotation[2] = rot[2];
            rotation[3] = rot[3];
        }
        this.incomingRotationEvents = [];

        // Here we could perform additional filtering
        if (rotation)
        {
            // console.log(`
            //     ${rotation[0].toFixed(4)},
            //     ${rotation[1].toFixed(4)};
            //     ${rotation[2].toFixed(4)},
            //     ${rotation[3].toFixed(4)}
            // `);

            let clientModel = this.graphicsEngine.app.model.client;
            clientModel.triggerEvent('r', rotation);
        }
    },

    clipOblique(mirror, mirrorCamera, localRecorder)
    {
        let matrix = new Matrix4();
        matrix.extractRotation(mirror.matrix);

        // Reversal criterion: vector(pos(x)-pos(cam)) dot vector(x normal)

        // x normal
        let vec1 = new Vector3(0, 0, 1);
        vec1.applyMatrix4(matrix);

        // pos(x)-pos(camera)
        let posX = mirror.position;
        //let  = localRecorder.position;
        let posC = new Vector3();
        posC.setFromMatrixPosition(localRecorder.matrixWorld);

        let vec2 = new Vector3();
        vec2.x = posX.x - posC.x;
        vec2.y = posX.y - posC.y;
        vec2.z = posX.z - posC.z;

        // mirrorCamera.getWorldDirection(vec2);

        //let camPosition = new Vector3();
        //camPosition.setFromMatrixPosition(mirrorCamera.matrixWorld);
        //let vec1 = mirror.normal;
        //let vec2 = new Vector3(0,0, -1);
        //vec2.applyQuaternion(mirrorCamera.quaternion);
        //let vec2 = new Vector3(mirrorCamera.matrix[8], mirrorCamera.matrix[9], mirrorCamera.matrix[10]);

        if (!vec1 || !vec2)
        {
            console.log('[XCam] Dot product error.');
            return;
        }

        //let dot = mirror.position.dot(camPosition);
        let dot = vec1.dot(vec2);
        let s = Math.sign(dot);
        //console.log(s);
        //console.log(dot);
        let normalFactor = 1; // [Expert] replace with -1 to invert normal.
        let N = new Vector3(0, 0, s * normalFactor);
        N.applyMatrix4(matrix);

        //update mirrorCamera matrices!!
        //mirrorCamera.
        mirrorCamera.updateProjectionMatrix();
        mirrorCamera.updateMatrixWorld();
        mirrorCamera.matrixWorldInverse.getInverse(mirrorCamera.matrixWorld);

        // now update projection matrix with new clip plane
        // implementing code from: http://www.terathon.com/code/oblique.html
        // paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
        let clipPlane = new Plane();
        clipPlane.setFromNormalAndCoplanarPoint(N, mirror.position);
        clipPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);

        clipPlane = new Vector4(
            clipPlane.normal.x,
            clipPlane.normal.y,
            clipPlane.normal.z,
            clipPlane.constant);

        let q = new Vector4();
        let projectionMatrix = mirrorCamera.projectionMatrix;

        let sgn = Math.sign;
        q.x = (sgn(clipPlane.x) +
            projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (sgn(clipPlane.y) +
            projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) /
            mirrorCamera.projectionMatrix.elements[14];

        // Calculate the scaled plane vector
        let c = new Vector4();
        c = clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

        // Replace the third row of the projection matrix
        projectionMatrix.elements[2] = c.x;
        projectionMatrix.elements[6] = c.y;
        projectionMatrix.elements[10] = c.z + 1.0;
        projectionMatrix.elements[14] = c.w;
    },

    setAbsRotationFromServer(theta0, theta1)
    {
        if (this.oldTheta1 === theta1 && this.oldTheta0 === theta0) return false;
        this.setAbsRotation(theta0, theta1);
        this.oldTheta0 = theta0;
        this.oldTheta1 = theta1;
        return true;
    },

    setAbsRotation(theta0, theta1)
    {
        let camera = this.mainCamera;
        let raycasterCamera = this.mainRaycasterCamera;
        theta1 = Math.max(0, Math.min(Math.PI, theta1));

        // | this line is unsafe
        // V
        camera.setUpRotation(theta1, 0, theta0);
        // because the camera rotation has changed since the last update,
        // therefore the new angle set here is outdated
        // resulting in camera jitters whenever this is called
        // (for variable gravity or on the edge of 3D worlds)
        // Solution: client-wise gravity computation (milestone).

        raycasterCamera.setUpRotation(theta1, 0, theta0);
    },

    setRelRotation(theta0, theta1)
    {
        let camera = this.mainCamera;
        let raycasterCamera = this.mainRaycasterCamera;
        // let rotationZ = camera.getZRotation();
        // let rotationX = camera.getXRotation();
        raycasterCamera.setZRotation(theta0);
        raycasterCamera.setXRotation(theta1);
        camera.setZRotation(theta0);
        camera.setXRotation(theta1);
    },

    moveCameraFromMouse(relX, relY, absX, absY)
    {
        // Rotate main camera.
        let camera = this.mainCamera;
        camera.rotateZ(-relX * 0.002);
        camera.rotateX(-relY * 0.002);
        let rotationZ = camera.getZRotation();
        let rotationX = camera.getXRotation();

        // Current up vector -> angles.
        let up = camera.get3DObject().rotation;
        let theta0 = up.z;
        let theta1 = up.x;

        // Rotate raycaster camera.
        let raycasterCamera = this.mainRaycasterCamera;
        raycasterCamera.setZRotation(rotationZ);
        raycasterCamera.setXRotation(rotationX);

        if (absX !== 0 || absY !== 0)
        {
            // Add angles.
            this.setAbsRotation(theta0 + absX, theta1 + absY);
            // theta0 = theta0 + absX;
            // theta1 = Math.max(0, Math.min(Math.PI, theta1 + absY));
            // camera.setUpRotation(theta1, 0, theta0);
            // raycasterCamera.setUpRotation(theta1, 0, theta0);
        }

        // Apply transform to portals.
        this.updateCameraPortals(camera, rotationZ, rotationX, theta1, theta0);

        // Apply transform to local model.
        this.graphicsEngine.app.model.server.selfModel.cameraMoved(this.mainCamera);

        // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
        // camera.quaternion.multiply(tmpQuaternion);
        // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);
        return [rotationZ, rotationX, theta0, theta1];
    },

    updateCameraPortals(camera, rotationZ, rotationX, theta1, theta0)
    {
        let localRecorder = camera.getRecorder();
        this.subCameras.forEach(function(subCamera) //, cameraId
        {
            // TODO [PORTAL] update cam pos, rot, rel. to portal position.
            // remark. shouldn’t i clip after having rotated?
            subCamera.setZRotation(rotationZ);
            subCamera.setXRotation(rotationX);
            subCamera.setUpRotation(theta1, 0, theta0);

            let mirrorCamera = subCamera.getRecorder();
            let mirror = subCamera.getScreen().getMesh();
            //let camera = mirrorCamera;
            if (mirrorCamera) {
                this.clipOblique(mirror, mirrorCamera, localRecorder);
            }
        }.bind(this));
    },

    resize(width, height)
    {
        let aspect = width / height;

        // Main cam
        let camera = this.mainCamera.getRecorder();
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        // Raycast
        let raycasterCamera = this.mainRaycasterCamera.getRecorder();
        raycasterCamera.aspect = aspect;
        raycasterCamera.updateProjectionMatrix();

        // Portals
        this.subCameras.forEach(function(currentCamera/*, cameraId*/) {
            let recorder = currentCamera.getRecorder();
            recorder.aspect = aspect;
            recorder.updateProjectionMatrix();
        });
        this.stencilCamera.aspect = aspect;
        this.stencilCamera.updateProjectionMatrix();

        // Water
        this.waterCamera.camera.aspect = aspect;
        this.waterCamera.camera.updateProjectionMatrix();
    },

    // Raycasting.
    createRaycaster()
    {
        return new Raycaster();
    },

    performRaycast()
    {
        let graphicsEngine = this.graphicsEngine;
        let chunkModel = graphicsEngine.app.model.server.chunkModel;
        let selfModel = graphicsEngine.app.model.server.selfModel;

        let raycaster = this.raycaster;
        let camera = this.mainRaycasterCamera.getRecorder();
        let mc = this.mainCamera.getRecorder();
        mc.updateMatrixWorld();
        camera.matrixWorld.copy(mc.matrixWorld);
        let terrain = chunkModel.getCloseTerrain(selfModel.worldId);

        let intersects;
        raycaster.setFromCamera(new Vector2(0, 0), camera);
        intersects = raycaster.intersectObjects(terrain);

        return intersects;
    },

    cleanup()
    {
        this.mainCamera = this.createCamera(false, -1);
        this.mainCamera.setCameraId(-1);
        this.subCameras.clear();
        this.mainRaycasterCamera = this.createCamera(true, -1);
        this.raycaster = this.createRaycaster();
        this.oldTheta0 = 0;
        this.oldTheta1 = 0;
    }

});

extend(CameraManager.prototype, WaterCameraModule);

/** Interface with graphics engine. **/

let CamerasModule = {

    createCameraManager()
    {
        return new CameraManager(this);
    },

    getCameraCoordinates()
    {
        return this.cameraManager.mainCamera.getCameraPosition();
    },

    getCameraForwardVector()
    {
        return this.cameraManager.mainCamera.getCameraForwardVector();
    },

    /** @deprecated */
    switchToCamera(oldId, newId)
    {
        return this.cameraManager.switchToCamera(oldId, newId);
    }

};

export { CamerasModule, DEFAULT_CAMERA };
