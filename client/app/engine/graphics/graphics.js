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
    // TODO [LOW] customize newMesh size variable
    this.defaultGeometrySize = 64; 

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
    // document.body.appendChild(this.fps.dom);

    // Animations
    this.initializeAnimations();

    // Textures
    this.loadTextures();
    
    // Optimizations
    this.portalUpdates = [];
    this.lastRenderPaths = new Set();
    this.lastRenderGates = new Set();
};

extend(App.Engine.Graphics.prototype, {

    run: function() {

        // Controls are tightly linked to camera.
        this.initializeControls();

        // Init animation.
        this.resize();
        this.animate();

        // Init stats.
        // document.body.appendChild(this.fps.dom);
    },

    /** Main loop. **/

    animate: function() {
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
        
        // Rendering twice fixes inertia artifacts on WebGL render targets AND I DON'T KNOW WHY.
        // Perf loss is visually compensated by the decoupled camera movement aggregation scheme.
        serverModel.refresh();
        this.render();
        clientModel.refresh();
    },

    render: function() {
        var sceneManager = this.sceneManager;
        var cameraManager = this.cameraManager;
        var rendererManager = this.rendererManager;
        var portals = this.app.model.server.xModel.portals;
        
        // Refresh portals.
        this.processPortalUpdates();
        
        // Refresh camera mouse movements.
        cameraManager.refresh();
        
        // Perform rendering.
        rendererManager.render(sceneManager, cameraManager, portals);
    },

    stop: function() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }
    },

    resize: function() {
        var width = window.innerWidth;
        var height = window.innerHeight;

        // Update aspects.
        this.cameraManager.resize(width, height);

        // Update main renderer.
        this.rendererManager.resize(width, height);

        // Resize render targets.
        this.sceneManager.resize(width, height);
    },

    getCameraInteraction: function() {
        return this.app.model.client.getCameraInteraction();
    }

});
