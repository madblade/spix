/**
 * Front-end graphics.
 */

'use strict';

App.Engine.Graphics = function(app) {
    this.app = app;

    // Rendering
    this.renderer = this.getRenderer();
    this.scene = this.getScene(); // TODO states
    this.camera = this.getCamera(); // TODO states
    this.requestId = null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);
};

App.Engine.Graphics.prototype.run = function() {
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
