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

    // Animations
    this.prevTime = Date.now();
    this.mixers =       new Map();

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);

    this.initObjects();
};

App.Engine.Graphics.prototype.run = function() {
    var controlsEngine = this.app.engine.controls;

    var controls = controlsEngine.getControls('first-person', this.camera);
    this.setControls(controls);

    // if (this.displayAvatar) this.scene.add(this.avatar);
    // this.scene.add(this.light);

    // var p = this.avatar.position;
    // this.positionCameraBehind(this.controls.getObject(), [p.x, p.y, p.z]);

    // Init animation.
    this.animate();
};

App.Engine.Graphics.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
};

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

App.Engine.Graphics.prototype.updateAnimation = function(entityId) {
    var mixer = this.mixers.get(entityId);
    if (mixer !== undefined) {
        var time = Date.now();
        mixer.update( (time - this.prevTime) * 0.001);
        this.prevTime = time;
    }
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

App.Engine.Graphics.prototype.setControls = function(controls, getDirection) {
    this.scene.remove(this.scene.getObjectByName("controls"));
    this.controls = controls;
    this.controls.name = "controls";
    this.scene.add(this.controls.getObject());
};

App.Engine.Graphics.prototype.startListeners = function() {
    this.controls.startListeners();
};

App.Engine.Graphics.prototype.stopListeners = function() {
    this.controls.stopListeners();
};
