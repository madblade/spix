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

// TODO [CRIT] remove this portal dependency
App.Engine.Graphics.RendererManager.prototype.render = function(sceneManager, cameraManager, portals) {
    var renderer = this.renderer;

    // Render first pass.
    var mainScene = sceneManager.mainScene;
    var mainCamera = cameraManager.mainCamera.getRecorder();
    renderer.render(mainScene, mainCamera);

    // Render every portal.
    var subScenes = sceneManager.subScenes;
    var subCameras = cameraManager.subCameras;
    var screens = sceneManager.screens;
    var renderCount = 0;
    var renderMax = this.renderMax;

    screens.forEach(function(screen, portalId) {
        if (!screen.isLinked()) { console.log('Not rendering screen ' + portalId); return; }

        if (renderCount > renderMax) return;

        var bufferTexture = screen.getRenderTarget();
        if (!bufferTexture) { console.log('Could not get matching RTT.'); return; }
        var bufferCamera = subCameras.get(portalId).getRecorder();
        if (!bufferCamera) { console.log('Could not get matching camera.'); return; }
        var bufferSceneId = screen.getOtherWorldId();
        var bufferScene = subScenes.get(bufferSceneId);
        if (!bufferScene) {
            // Happens when current portal is a stub.
            // console.log('Could not get matching scene.');
            return;
        }

        // Before a portal P1 render, we must ensure that its other end P2
        // is removed from the matching scene.
        // 1 World <-> 1 Scene
        // 1 Scene <-> multiple portals, so we have to remove 1 port
        // and put it back after every render.
        var portal = portals.get(portalId);
        if (!portal) return;
        var otherScreen = screens.get(portal.portalLinkedForward);
        var otherEnd = null;
        if (otherScreen) otherEnd = otherScreen.getMesh();
        if (otherEnd) sceneManager.removeObject(otherEnd, bufferSceneId);

        // Do render.
        renderer.render(bufferScene, bufferCamera, bufferTexture);

        if (otherEnd) sceneManager.addObject(otherEnd, bufferSceneId);
        ++renderCount;
    });

    // TODO [HIGH] sort rendering textures according to positions in World Model.
    // renderer.render(bufferScene, camera, bufferTexture);

    // Render second pass (avoid portal texture lags).
    if (renderCount > 0)
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
