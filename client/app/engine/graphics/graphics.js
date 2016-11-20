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
    this.renderer =     this.createRenderer();
    this.controls =     null;
    this.requestId =    null;

    this.scene =        this.createScene();
    this.camera =       this.createCamera();
    this.raycaster =    this.createRaycaster();

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

// App.Engine.Graphics.prototype.getCloseTerrain = function() {
//     var meshes = [];
//     var chks = this.chunks;
//     for (var cid in chks) {
//         // TODO extract on 4 closest chunks.
//         var currentChunk = chks[cid];
//         if (!currentChunk.meshes) {
//             console.log("Warn: corrupted chunk inside client model " + cid);
//             continue;
//         }
//         currentChunk.meshes.forEach(function(mesh) {meshes.push(mesh)});
//     }
//     return meshes;
// };

App.Engine.Graphics.prototype.startListeners = function() {
    this.controls.startListeners();
};

App.Engine.Graphics.prototype.stopListeners = function() {
    this.controls.stopListeners();
};
