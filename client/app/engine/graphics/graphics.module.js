/**
 * Front-end graphics.
 */

'use strict';

App.Engine.Graphics = function(app) {
    this.app = app;

    // User customizable settings.
    this.settings = {};

    // Rendering
    this.renderer = this.getRenderer();
    this.scene = this.getScene(); // TODO states
    this.camera = this.getCamera(); // TODO states
    this.controls = null;
    this.requestId = null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);

    // Semi-model objects
    this.light = null; // Only 1 for the moment.
    this.avatar = null;
    this.blocks = [];
    this.entities = {};
    this.displayAvatar = false;

    this.initObjects();
};

// Setup basic objects (terrain, avatar).
App.Engine.Graphics.prototype.initObjects = function() {
    // Lights
    this.light = this.getLight('hemisphere');
    this.light.position.set( 0.5, 1, 0.75 );

    // Player
    this.avatar = this.getMesh(
        this.getGeometry('box'),
        this.getMaterial('flat-phong')
    );

    // Terrain
    var temporaryGeometry = this.getGeometry('plane');
    temporaryGeometry.rotateZ(-Math.PI/2);
    this.temporaryPlane = this.getMesh(
        temporaryGeometry,
        this.getMaterial('basic-black')
    );
};

App.Engine.Graphics.prototype.run = function() {
    // Init objects.
    this.setControls(this.app.uiEngine.getControls('first-person', this.camera).getObject());
    if (this.displayAvatar) this.scene.add(this.avatar);
    this.scene.add(this.light);
    this.scene.add(this.temporaryPlane);
    this.positionCameraBehind(this.controls, [0, 0, 0]);

    // Init animation.
    this.animate();
};

App.Engine.Graphics.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
};

App.Engine.Graphics.prototype.animate = function() {
    // Request animation frame.
    this.requestId = requestAnimationFrame(this.animate.bind(this));

    // Render.
    this.render();

    // Update controls (done here for efficiency purposes).
    this.app.uiEngine.update();
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

App.Engine.Graphics.prototype.setControls = function(controls) {
    this.scene.remove(this.scene.getObjectByName("controls"));
    this.controls = controls;
    this.controls.name = "controls";
    this.scene.add(this.controls);
};

App.Engine.Graphics.prototype.getCamera = function() {
    return this.camera;
};
