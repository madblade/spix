/**
 * Scenes management.
 */

'use strict';

App.Engine.Graphics.SceneManager = function() {
    this.mainScene = this.createScene('-1');
    this.subScenes  = new Map();
    this.screens = new Map();
};

App.Engine.Graphics.SceneManager.prototype.createScene = function(newSceneId) {
    var scene = new THREE.Scene();
    scene.sceneId = newSceneId;
    return scene;
};

// Create and push scene with 'newSceneId' in this.subScenes.
// If scene exists already (i.e. it's 'mainScene'), simply push it into this.subScenes
App.Engine.Graphics.SceneManager.prototype.addScene = function(newSceneId, scene) {
    if (!scene) scene = this.createScene(newSceneId);
    this.subScenes.set(newSceneId, scene);
    return scene;
};

// Switch main scene with some scene that must be in this.subScenes
App.Engine.Graphics.SceneManager.prototype.switchToScene = function(sceneId) {
    var newMainScene = this.subScenes.get(sceneId);
    if (!newMainScene) { console.log('Failed to switch to scene ' + sceneId); return; }
    var oldMainScene = this.mainScene;
    var oldMainSceneId = oldMainScene.sceneId;

    this.mainScene = newMainScene;
    this.subScenes.delete(sceneId);
    this.addScene(oldMainSceneId, oldMainScene);
};

App.Engine.Graphics.SceneManager.prototype.addObject = function(object, sceneId) {
    var scene = this.getScene(sceneId);
    if (scene) scene.add(object);
};

App.Engine.Graphics.SceneManager.prototype.removeObject = function(object, sceneId) {
    var scene = this.getScene(sceneId);
    if (scene) {
        scene.remove(object);
        if (object.geometry) { object.geometry.dispose(); object.geometry = null; }
        if (object.material) { object.material.dispose(); object.material = null; }
    }
};

App.Engine.Graphics.SceneManager.prototype.getScene = function(sceneId) {
    return (sceneId == this.mainScene.sceneId ? this.mainScene : this.subScenes.get(sceneId));
};

/** Interface with graphics engine. **/

App.Engine.Graphics.prototype.createSceneManager = function() {
    return new App.Engine.Graphics.SceneManager(this);
};

App.Engine.Graphics.prototype.addToScene = function(object3D, sceneId) {
    var sceneManager = this.sceneManager;
    if (!sceneId) sceneId = sceneManager.mainScene.sceneId;
    sceneId = parseInt(sceneId);
    sceneManager.addObject(object3D, sceneId);
};

App.Engine.Graphics.prototype.removeFromScene = function(object3D, sceneId) {
    var sceneManager = this.sceneManager;
    if (!sceneId) sceneId = sceneManager.mainScene.sceneId;
    sceneId = parseInt(sceneId);
    sceneManager.removeObject(object3D, sceneId);
};

App.Engine.Graphics.prototype.addScene = function(newSceneId) {
    newSceneId = parseInt(newSceneId);
    var sceneManager = this.sceneManager;

    // Trying to add an existing scene
    if (newSceneId == sceneManager.mainScene.sceneId ||
        sceneManager.subScenes.has(newSceneId)) {
        console.log('Trying to add an existing scene: ' + newSceneId);
        return;
    }

    return sceneManager.addScene(newSceneId);
};

// TODO [CRIT] unload portal, screen, shaders.
App.Engine.Graphics.prototype.forgetScene = function(sceneId) {
    var sceneManager = this.sceneManager;

    // Don't delete current scene or a scene that does not exist.
    if (sceneId == sceneManager.mainScene.sceneId ||
        !sceneManager.subScenes.has(sceneId)) {
        console.log('Trying to delete main scene or unknown scene: ' + sceneId);
        return;
    }

    this.subScenes.delete(sceneId);
};

App.Engine.Graphics.prototype.getScene = function(sceneId) {
    return this.sceneManager.getScene(sceneId);
};

App.Engine.Graphics.prototype.addScreen = function(screenId, screenObject) {
    this.sceneManager.screens.set(screenId, screenObject);
};

App.Engine.Graphics.prototype.getScreen = function(screenId) {
    return this.sceneManager.screens.get(screenId);
};
