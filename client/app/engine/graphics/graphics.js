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
    this.requestId =    null;
    this.rendererManager    = this.createRendererManager();
    this.sceneManager       = this.createSceneManager();
    this.cameraManager      = this.createCameraManager();

    // TODO remove
    //this.renderer =     this.createRenderer();
    //this.scene =        this.createScene();
    //this.camera =       this.createCamera();
    //this.raycaster =    this.createRaycaster();

    // Interaction.
    this.controls =     null;
    this.interaction =  'FP';

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.rendererManager.renderer.domElement);

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

    // Render.
    serverModel.refresh();
    this.render();
    clientModel.refresh();
};

App.Engine.Graphics.prototype.render = function() {
    this.rendererManager.render(this.sceneManager, this.cameraManager);
};

App.Engine.Graphics.prototype.stop = function() {
    if (this.requestId) {
        cancelAnimationFrame(this.requestId);
    }
};

App.Engine.Graphics.prototype.resize = function () {
    var width = window.innerWidth;
    var height = window.innerHeight;
    this.cameraManager.resize(width, height);
    this.rendererManager.resize(width, height);
};
