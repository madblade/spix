/**
 * Renderer, render layers management.
 */

'use strict';

App.Engine.Graphics.RendererManager = function() {
    // Cap number of passes.
    this.renderMax = Number.POSITIVE_INFINITY;

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
    var screens = sceneManager.screens;

    var renderCount = 0;
    var renderMax = this.renderMax;
    screens.forEach(function(screen, portalId) {
        if (screen.length !== 3) { console.log('Not rendering screen ' + portalId + ',' + screen.length); return; }

        if (renderCount > renderMax) return;

        var bufferTexture = screen[1];
        if (!bufferTexture) { console.log('Could not get matching RTT.'); return; }
        var bufferCamera = subCameras.get(portalId);
        if (!bufferCamera) { console.log('Could not get matching camera.'); return; }
        var bufferScene = subScenes.get(screen[2]);
        if (!bufferScene) {
            // Happens when current portal is a stub.
            // console.log('Could not get matching scene.');
            return;
        }

        renderer.render(bufferScene, bufferCamera, bufferTexture);
        ++renderCount;
    });

    // TODO [HIGH] sort rendering textures according to positions in World Model.
    // renderer.render(bufferScene, camera, bufferTexture);
    renderer.render(mainScene, mainCamera);
};

App.Engine.Graphics.RendererManager.prototype.resize = function(width, height) {
    if (!width) width = window.innerWidth;
    if (!height) height = window.innerHeight;
    this.renderer.setSize(width, height);
};

/** Interface with graphics engine. **/

App.Engine.Graphics.prototype.createRendererManager = function() {
    return new App.Engine.Graphics.RendererManager();
};
