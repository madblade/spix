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
    this.controls = null;
    this.requestId = null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);

    // Lights
    this.light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );

    // Materials
    var blockMaterial = new THREE.MeshPhongMaterial({
        specular: 0xffffff,
        shading: THREE.FlatShading,
        vertexColors: THREE.VertexColors
    });

    // Geometries
    this.avatar = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 5),
        blockMaterial
    );
    var temporaryGeometry = new THREE.PlaneGeometry( 100, 100, 100, 100 );
    temporaryGeometry.rotateX( - Math.PI / 2 );
    this.temporaryPlane = new THREE.Mesh(
        temporaryGeometry,
        new THREE.MeshBasicMaterial({wireframe:true, color:0x000000})
    );
    this.blocks = [];
    this.entities = [];
};

App.Engine.Graphics.prototype.run = function() {
    // Init objects.
    this.setControls(this.app.uiEngine.getControls('first-person', this.camera).getObject());
    this.scene.add(this.avatar);
    this.light.position.set( 0.5, 1, 0.75 );
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
