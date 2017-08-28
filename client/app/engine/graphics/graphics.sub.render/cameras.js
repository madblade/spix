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
    this.mainCamera = this.createCamera(false, -1);
    this.mainCamera.setCameraId(-1);
    this.subCameras = new Map();

    this.mainRaycasterCamera = this.createCamera(true, -1);
    this.raycaster = this.createRaycaster();
    
    this.incomingRotationEvents = [];
};

// Factory.

extend(App.Engine.Graphics.CameraManager.prototype, {

    createCamera: function(forRaycaster, worldId) {
        // Resize (when window is resized on hub, portals are not affected)
        this.mainAspect = window.innerWidth / window.innerHeight;

        return new App.Engine.Graphics.Camera(
            this.mainFOV,
            this.mainAspect,
            (forRaycaster ? 1 : this.mainNear), // TODO [LOW] check security.
            this.mainFar,
            worldId);
    },

    addCamera: function(frameSource, frameDestination, cameraPath, cameraTransform) {
        var cameraId = cameraPath;

        // TODO [CRIT] compute relative positions and rotations.

        if (this.subCameras.has(cameraId)) {
            //console.log('Camera ' + cameraId + ' cannot be added a second time.');
            console.log('Skipping camera addition.');
            return;
        }

        var mainCamera = this.mainCamera;
        var camera = this.createCamera(false);
        camera.setCameraId(cameraId);
        camera.setCameraTransform(cameraTransform);
        this.subCameras.set(cameraId, camera);

        var mainPosition = mainCamera.getCameraPosition();
        camera.setCameraPosition(mainPosition.x, mainPosition.y, mainPosition.z);
        camera.setZRotation(mainCamera.getZRotation());
        camera.setXRotation(mainCamera.getXRotation());
    },

    addCameraToScene: function(cameraId, worldId) {
        worldId = parseInt(worldId);
        
        var camera = this.subCameras.get(cameraId);
        if (!camera && cameraId === this.mainCamera.getCameraId())
            camera = this.mainCamera;
        if (!camera) {
            console.log('@addCamera: could not get wrapper for camera ' + cameraId);
            return;
        }
        
        camera.setWorldId(worldId);
        this.graphicsEngine.addToScene(camera.get3DObject(), worldId);
    },

    // TODO [HIGH] investigate the Camera Path Problem.
    removeCamera: function(cameraId) {

    },

    removeCameraFromScene: function(cameraId, worldId) {
        worldId = parseInt(worldId);
        var camera = this.subCameras.get(cameraId);
        if (!camera && cameraId === this.mainCamera.getCameraId())
            camera = this.mainCamera;
        if (!camera) {
            console.log('@removeCamera: could not get wrapper for camera ' + cameraId);
            return;
        }
        
        if (!worldId) worldId = camera.getWorldId();

        this.graphicsEngine.removeFromScene(camera.get3DObject(), worldId);
    },

    switchMainCameraToWorld: function(oldMainSceneId, sceneId) {
        var mainCamera = this.mainCamera;
        var mainRaycasterCamera = this.mainRaycasterCamera;
        var graphics = this.graphicsEngine;

        graphics.removeFromScene(mainCamera.get3DObject(), oldMainSceneId);
        graphics.removeFromScene(mainRaycasterCamera.get3DObject(), oldMainSceneId);

        graphics.addToScene(mainCamera.get3DObject(), sceneId);
        graphics.addToScene(mainRaycasterCamera.get3DObject(), sceneId);
    },

    // TODO [HIGH] passify, dont forget raycaster
    switchToCamera: function(oldWorldId, newWorldId) {
        //var newMainCamera = this.subCameras.get(newMainCameraId);
        //if (!newMainCamera) { console.log('Failed to switch with camera ' + newMainCameraId); return; }
        //var oldMainCamera = this.mainCamera;

        //this.mainCamera = newMainCamera;
        //this.subCameras.set(oldMainCameraId, oldMainCamera);
    },

    // Update.
    updateCameraPosition: function(vector) {
        var cams = [this.mainCamera, this.mainRaycasterCamera];
        this.subCameras.forEach(function(cam) { cams.push(cam); });

        var i = this.graphicsEngine.getCameraInteraction();

        // TODO [HIGH] generalize (server-side, comes with collision cross-p)
        var x = vector[0];
        var y = vector[1];
        var z = vector[2] + 1.6;
        //var z = vector[2];

        if (i.isFirstPerson()) {
            cams.forEach(function(cam, cameraId) {
                cam.setCameraPosition(x, y, z);
                cam.setFirstPerson();
            });
        }

        else if (i.isThirdPerson()) {
            cams.forEach(function(cam, cameraId) {
                cam.setCameraPosition(x, y, z);
                cam.setThirdPerson();
            });
        }
    },
    
    // TODO [CRIT] 3Dize
    addCameraRotationEvent: function(relX, relY, absX, absY) {
        this.incomingRotationEvents.push([relX, relY, absX, absY]);
    },
    
    refresh: function() {
        var incoming = this.incomingRotationEvents;
        if (incoming.length < 1) return;
        
        var rotation = [0, 0, 0, 0];
        for (var i = 0, l = incoming.length; i < l; ++i) {
            var inc = incoming[i];
            var rot = [0, 0, 0, 0];
            rot = this.moveCameraFromMouse(inc[0], inc[1], inc[2], inc[3]);
            rotation[0] = rot[0];
            rotation[1] = rot[1];
            rotation[2] = rot[2];
            rotation[3] = rot[3];
        }
        this.incomingRotationEvents = [];

        // TODO [MEDIUM] perform additional filtering
        if (rotation) {
            /*
            console.log(
                rotation[0].toFixed(4) + ', ' + 
                rotation[1].toFixed(4) + ' ; ' + 
                rotation[2].toFixed(4) + ', ' + 
                rotation[3].toFixed(4)
            );
            */
            
            var clientModel = this.graphicsEngine.app.model.client;
            clientModel.triggerEvent('r', rotation);
        }
    },

    moveCameraFromMouse: function(relX, relY, absX, absY) {
        // Rotate main camera.
        var camera = this.mainCamera;
        camera.rotateZ(-relX * 0.002);
        camera.rotateX(-relY * 0.002);
        var rotationZ = camera.getZRotation();
        var rotationX = camera.getXRotation();

        // Current up vector -> angles.
        var up = camera.get3DObject().rotation;
        var theta0 = up.z;
        var theta1 = up.x;
        
        // Rotate raycaster camera.
        var raycasterCamera = this.mainRaycasterCamera;
        raycasterCamera.setZRotation(rotationZ);
        raycasterCamera.setXRotation(rotationX);
        
        if (absX != 0 || absY != 0) {
            // Add angles.
            theta0 = theta0 + absX;
            theta1 = Math.max(0, Math.min(Math.PI, theta1 + absY));
            camera.setUpRotation(theta1, 0, theta0);
            raycasterCamera.setUpRotation(theta1, 0, theta0);
        }
        

        // Apply transform to portals.
        this.subCameras.forEach(function(subCamera, cameraId) {
            // TODO [CRIT] update camera position, rotation rel. to portal position.
            subCamera.setZRotation(rotationZ);
            subCamera.setXRotation(rotationX);
            subCamera.setUpRotation(theta1, 0, theta0)
        });

        // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
        // camera.quaternion.multiply(tmpQuaternion);
        // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);
        return [rotationZ, rotationX, theta0, theta1];
    },

    resize: function(width, height) {
        // TODO [HIGH] apply to other cameras AND RENDER TARGETS (DONT FORGET).
        var aspect = width / height;

        var camera = this.mainCamera.getRecorder();
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        var raycasterCamera = this.mainRaycasterCamera.getRecorder();
        raycasterCamera.aspect = aspect;
        raycasterCamera.updateProjectionMatrix();

        this.subCameras.forEach(function(currentCamera, cameraId) {
            var recorder = currentCamera.getRecorder();
            recorder.aspect = aspect;
            recorder.updateProjectionMatrix();
        });
    },

    // Raycasting.
    createRaycaster: function() {
        return new THREE.Raycaster();
    },

    performRaycast: function() {
        var graphicsEngine = this.graphicsEngine;
        var chunkModel = graphicsEngine.app.model.server.chunkModel;
        var selfModel = graphicsEngine.app.model.server.selfModel;

        var raycaster = this.raycaster;
        var camera = this.mainRaycasterCamera.getRecorder();
        var terrain = chunkModel.getCloseTerrain(selfModel.worldId);

        var intersects;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        intersects = raycaster.intersectObjects(terrain);

        return intersects;
    }

});

/** Interface with graphics engine. **/

extend(App.Engine.Graphics.prototype, {

    createCameraManager: function() {
        return new App.Engine.Graphics.CameraManager(this);
    },

    getCameraCoordinates: function() {
        return this.cameraManager.mainCamera.getCameraPosition();
    },

    switchToCamera: function(oldId, newId) {
        return this.cameraManager.switchToCamera(oldId, newId);
    }

});
