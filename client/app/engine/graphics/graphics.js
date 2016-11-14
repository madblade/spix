/**
 * Front-end graphics.
 */

'use strict';

App.Engine.Graphics = function(app) {
    this.app = app;

    // User customizable settings.
    this.settings = {
        // debug: false
    };

    // Properties.
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.defaultGeometrySize = 64; // TODO customize newMesh size variable

    // Rendering.
    this.renderer = this.getRenderer();
    this.scene = this.getScene();
    this.camera = this.getCamera();
    this.raycaster = this.getRaycaster();
    this.controls = null;
    this.requestId = null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);

    this.initObjects();
};

App.Engine.Graphics.prototype.run = function() {
    // Init objects.

    // TODO decouple
    var controls = this.app.engine.controls.getControls('first-person', this.camera);
    this.setControls(controls);

    if (this.displayAvatar) this.scene.add(this.avatar);

    this.scene.add(this.light);

    this.positionCameraBehind(this.controls.getObject(),
        [this.avatar.position.x, this.avatar.position.y, this.avatar.position.z]);

    // Init animation.
    this.animate();
};

App.Engine.Graphics.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
};

App.Engine.Graphics.prototype.animate = function() {
    var clientModel = this.app.model.client;

    // Request animation frame.
    this.requestId = requestAnimationFrame(this.animate.bind(this));

    // Render.
    this.render();
    clientModel.refresh();
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

App.Engine.Graphics.prototype.getCloseTerrain = function() {
    var meshes = [];
    var chks = this.chunks;
    for (var cid in chks) {
        // TODO extract on 4 closest chunks.
        var currentChunk = chks[cid];
        if (!currentChunk.meshes) {
            console.log("Warn: corrupted chunk inside client model " + cid);
            continue;
        }
        currentChunk.meshes.forEach(function(mesh) {meshes.push(mesh)});
    }
    return meshes;
};
