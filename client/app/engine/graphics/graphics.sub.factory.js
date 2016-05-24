/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.getScene = function() {
    return new THREE.Scene();
};

App.Engine.Graphics.prototype.getRenderer = function() {
    // Configure renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setClearColor(0x435D74, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
};

App.Engine.Graphics.prototype.getCamera = function() {
    var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    return camera;
};

App.Engine.Graphics.prototype.getMaterial = function(whatMaterial) {
    var material;

    switch (whatMaterial) {
        case 'flat-phong':
            material = new THREE.MeshPhongMaterial({
                specular: 0xffffff,
                shading: THREE.FlatShading,
                vertexColors: THREE.VertexColors
            });
            break;

        case 'basic-black':
            material = new THREE.MeshBasicMaterial({
                wireframe:true,
                color:0x000000
            });
            break;

        default: // Block material
            material = new THREE.MeshBasicMaterial({
                color:0xff0000
            });
    }

    return material;
};

App.Engine.Graphics.prototype.getGeometry = function(whatGeometry) {
    var geometry;

    switch (whatGeometry) {
        case 'plane':
            geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
            break;

        case 'box':
            geometry = new THREE.BoxGeometry(5, 5, 5);
            break;

        default:
            geometry = new THREE.BoxGeometry(5, 5, 5);
    }

    return geometry;
};

App.Engine.Graphics.prototype.getMesh = function(geometry, material) {
    return new THREE.Mesh(geometry, material);
};

App.Engine.Graphics.prototype.getLight = function(whatLight) {
    var light;

    switch (whatLight) {
        case 'hemisphere':
            light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
            break;

        default:
            light = new THREE.AmbientLight( 0x404040 );
    }

    return light;
};
