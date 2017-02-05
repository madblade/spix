/**
 * Scenes management.
 */

'use strict';

App.Engine.Graphics.SceneManager = function() {
    this.mainScene = this.createScene('-1');
    this.subScenes  = new Map();
    this.screens = new Map();
};

extend(App.Engine.Graphics.SceneManager.prototype, {

    createScene: function(newSceneId) {
        var scene = new THREE.Scene();
        scene.sceneId = newSceneId;
        return scene;
    },

    // Create and push scene with 'newSceneId' in this.subScenes.
    // If scene exists already (i.e. it's 'mainScene'), simply push it into this.subScenes
    addScene: function(newSceneId, scene) {
        if (!scene) scene = this.createScene(newSceneId);
        this.subScenes.set(newSceneId, scene);
        return scene;
    },

    // Switch main scene with some scene that must be in this.subScenes
    switchToScene: function(sceneId, cameraManager) {
        sceneId = parseInt(sceneId);
        var newMainScene = this.subScenes.get(sceneId);
        if (!newMainScene) { console.log('Failed to switch to scene ' + sceneId); return; }
        var oldMainScene = this.mainScene;
        var oldMainSceneId = oldMainScene.sceneId;

        this.mainScene = newMainScene;
        this.subScenes.delete(sceneId);
        this.addScene(oldMainSceneId, oldMainScene);

        cameraManager.switchMainCameraToWorld(oldMainSceneId, sceneId);
        //var mainCameraId = cameraManager.mainCamera.getCameraId();
        //cameraManager.removeCameraFromScene(mainCameraId, oldMainSceneId);
        //cameraManager.addCameraToScene(mainCameraId, sceneId);
    },

    addObject: function(object, sceneId) {
        var scene = this.getScene(sceneId);
        if (scene) scene.add(object);
    },

    removeObject: function(object, sceneId) {
        var scene = this.getScene(sceneId);
        if (scene) {
            scene.remove(object);
            if (object.geometry) { object.geometry.dispose(); object.geometry = null; }
            if (object.material) { object.material.dispose(); object.material = null; }
        }
    },

    getScene: function(sceneId) {
        return (sceneId == this.mainScene.sceneId ? this.mainScene : this.subScenes.get(sceneId));
    },

    resize: function(width, height) {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;

        var screens = this.screens;
        screens.forEach(function(screen, portalId) {
            if (!screen.isLinked()) {
                console.log('Not resizing screen ' + portalId);
                return;
            }
            var bufferTexture = screen.getRenderTarget();
            bufferTexture.setSize(width, height);
        });
    },

    removeScreen: function(screenId) {
        var screen = this.screens.get(screenId);
        if (!screen) return;

        this.removeObject(screen.getMesh(), screen.getWorldId());
        this.screens.delete(screenId);
    }

});

/** Interface with graphics engine. **/

extend(App.Engine.Graphics.prototype, {

    createSceneManager: function() {
        return new App.Engine.Graphics.SceneManager(this);
    },

    addToScene: function(object3D, sceneId) {
        var sceneManager = this.sceneManager;
        if (!sceneId) sceneId = sceneManager.mainScene.sceneId;
        sceneId = parseInt(sceneId);
        sceneManager.addObject(object3D, sceneId);
    },

    removeFromScene: function(object3D, sceneId) {
        var sceneManager = this.sceneManager;
        if (!sceneId) sceneId = sceneManager.mainScene.sceneId;
        sceneId = parseInt(sceneId);
        sceneManager.removeObject(object3D, sceneId);
    },

    addScene: function(newSceneId) {
        newSceneId = parseInt(newSceneId);
        var sceneManager = this.sceneManager;

        // Trying to add an existing scene
        if (newSceneId == sceneManager.mainScene.sceneId ||
            sceneManager.subScenes.has(newSceneId)) {
            console.log('Trying to add an existing scene: ' + newSceneId);
            return;
        }

        return sceneManager.addScene(newSceneId);
    },

    // TODO [HIGH] unload scene.
    forgetScene: function(sceneId) {
        var sceneManager = this.sceneManager;

        // Don't delete current scene or a scene that does not exist.
        if (sceneId == sceneManager.mainScene.sceneId ||
            !sceneManager.subScenes.has(sceneId)) {
            console.log('Trying to delete main scene or unknown scene: ' + sceneId);
            return;
        }

        this.subScenes.delete(sceneId);
    },

    getScene: function(sceneId, force) {
        var scene = this.sceneManager.getScene(sceneId);
        if (!scene && force) {
            scene = this.addScene(sceneId);
        }
        return scene;
    },

    addScreen: function(screenId, screenObject) {
        this.sceneManager.screens.set(screenId, screenObject);
    },

    getScreen: function(screenId) {
        return this.sceneManager.screens.get(screenId);
    },

    removeScreen: function(screenId) {
        this.sceneManager.removeScreen(screenId);
    },

    switchToScene: function(oldSceneId, newSceneId) {
        console.log('Switching from ' + oldSceneId + ' to ' + newSceneId);
        this.sceneManager.switchToScene(newSceneId, this.cameraManager);
    }

});
