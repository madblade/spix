/**
 * Front-end graphics.
 */

'use strict';

App.Engine.Graphics = function(app) {
    this.app = app;

    // User customizable settings.
    this.debug = false;

    // Properties.
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.defaultGeometrySize = 64; // TODO customize newMesh size variable

    // Rendering.
    this.renderer =     this.createRenderer();
    this.controls =     null;
    this.requestId =    null;

    this.scene =        this.createScene();
    this.camera =       this.createCamera();
    this.raycaster =    this.createRaycaster();
    this.interaction =  'FP';

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);

    // Animations
    this.initializeAnimations();

    // Textures
    this.loadTextures();
};

App.Engine.Graphics.prototype.run = function() {

    // Controls are tightly linked to camera.
    this.initializeControls();

    // Init animation.
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
    this.renderer.render(this.scene, this.camera);
};

App.Engine.Graphics.prototype.stop = function() {
    if (this.requestId) {
        cancelAnimationFrame(this.requestId);
    }
};

App.Engine.Graphics.prototype.resize = function () {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
};
