/**
 * Scenes management.
 */

'use strict';

App.Engine.Graphics.SceneManager = function() {
    this.mainScene = this.createScene();
    this.subScenes  = new Map();
};

App.Engine.Graphics.SceneManager.prototype.createScene = function() {
    return new THREE.Scene();
};

// TODO [CRIT] addScene <-> addCamera
App.Engine.Graphics.SceneManager.prototype.addScene = function(scene) {
    if (!scene) scene = this.createScene();
    if (!scene.screen) {
        var width = window.innerWidth; // TODO [CRIT] 2-blocks render target.
        var height = window.innerHeight;
        var rtTexture = new THREE.WebGLRenderTarget(
            width, height,
            { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat }
        );

        var geometry = new THREE.PlaneBufferGeometry(width, height);
        var material = new THREE.MeshBasicMaterial( { color: 0xffffff, map: rtTexture.texture } );
        scene.screen = new THREE.Mesh(geometry, material);
    }

    // TODO [CRIT] compute new Id & dev model for knots.
    this.subScenes.set(1000, scene);
};

// TODO [CRIT] switch main scene with sub scene.
App.Engine.Graphics.SceneManager.prototype.switchToScene = function(sceneId){
    var newMainScene = this.subScenes.get(sceneId);
    if (!newMainScene) { console.log('Failed to switch to scene ' + sceneId); return; }
    var oldMainScene = this.mainScene;

    this.mainScene = newMainScene;
    this.subScenes.delete(sceneId);
    this.addScene(oldMainScene);
};

App.Engine.Graphics.SceneManager.prototype.addObject = function(object, sceneId) {
    var scene = sceneId === -1 ? this.mainScene : this.subScenes.get(sceneId);
    if (scene) scene.add(object);
};

App.Engine.Graphics.SceneManager.prototype.removeObject = function(object, sceneId) {
    var scene = sceneId === -1 ? this.mainScene : this.subScenes.get(sceneId);
    if (scene) {
        scene.remove(object);
        if (object.geometry) { object.geometry.dispose(); object.geometry = null; }
        if (object.material) { object.material.dispose(); object.material = null; }
    }
};

/** Interface with graphics engine. **/

App.Engine.Graphics.prototype.createSceneManager = function() {
    return new App.Engine.Graphics.SceneManager(this);
};

App.Engine.Graphics.prototype.addToScene = function(object3D, sceneId) {
    sceneId = parseInt(sceneId);
    if (!sceneId) sceneId = -1;
    this.sceneManager.addObject(object3D, sceneId);
};

App.Engine.Graphics.prototype.removeFromScene = function(object3D, sceneId) {
    sceneId = parseInt(sceneId);
    if (!sceneId) sceneId = -1;
    this.sceneManager.removeObject(object3D, sceneId);
};
