/**
 * Renderer, render layers management.
 */

'use strict';

App.Engine.Graphics.RendererManager = function() {
    this.renderer = this.createRenderer();
};

App.Engine.Graphics.RendererManager.prototype.createRenderer = function() {
    // Configure renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setClearColor(0x435D74, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
};

App.Engine.Graphics.RendererManager.prototype.render = function(sceneManager, cameraManager) {
    var renderer = this.renderer;
    var mainScene = sceneManager.mainScene;
    var mainCamera = cameraManager.mainCamera;

    var subScenes = sceneManager.subScenes;
    var subCameras = cameraManager.subCameras;

    // TODO [MEDIUM] sort rendering textures according to positions in World Model.
    // renderer.render(bufferScene, camera, bufferTexture);
    renderer.render(mainScene, mainCamera);
};

App.Engine.Graphics.RendererManager.prototype.resize = function(width, height) {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
};

/** Interface with graphics engine. **/

App.Engine.Graphics.prototype.createRendererManager = function() {
    return new App.Engine.Graphics.RendererManager();
};
