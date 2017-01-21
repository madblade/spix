/**
 * Front-end graphics.
 */

'use strict';

App.Engine.Graphics = function(app) {
    // App and access to models.
    this.app = app;

    // User customizable settings.
    this.debug = false;

    // Properties.
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.defaultGeometrySize = 64; // TODO [LOW] customize newMesh size variable

    // Rendering.
    this.requestId          = null;
    this.sceneManager       = this.createSceneManager();
    this.rendererManager    = this.createRendererManager();
    this.cameraManager      = this.createCameraManager();

    // Interaction.
    this.controls =     null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.rendererManager.renderer.domElement);

    // Benches.
    this.fps = new Stats();

    // Animations
    this.initializeAnimations();

    // Textures
    this.loadTextures();
};

App.Engine.Graphics.prototype.run = function() {

    // Controls are tightly linked to camera.
    this.initializeControls();

    // Init animation.
    this.resize();
    this.animate();

    // Init stats.
    // document.body.appendChild(this.fps.dom);
};

App.Engine.Graphics.prototype.stop = function() {
    cancelAnimationFrame(this.requestId);
};

/** Main loop. **/

App.Engine.Graphics.prototype.animate = function() {
    var clientModel = this.app.model.client;
    var serverModel = this.app.model.server;

    // Request animation frame.
    this.requestId = requestAnimationFrame(this.animate.bind(this));

    // Bench.
    this.fps.update();

    // Render.
    serverModel.refresh();
    this.render();
    clientModel.refresh();
};

App.Engine.Graphics.prototype.render = function() {
    var sceneManager = this.sceneManager;
    var cameraManager = this.cameraManager;
    var portals = this.app.model.server.xModel.portals;
    this.rendererManager.render(sceneManager, cameraManager, portals);
};

App.Engine.Graphics.prototype.stop = function() {
    if (this.requestId) {
        cancelAnimationFrame(this.requestId);
    }
};

App.Engine.Graphics.prototype.resize = function () {
    var width = window.innerWidth;
    var height = window.innerHeight;

    // Update aspects.
    this.cameraManager.resize(width, height);

    // Update main renderer.
    this.rendererManager.resize(width, height);

    // Resize render targets.
    this.sceneManager.resize(width, height);
};

App.Engine.Graphics.prototype.getCameraInteraction = function() {
    return this.app.model.client.getCameraInteraction();
};
