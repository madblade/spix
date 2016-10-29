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
    var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.0001, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    return camera;
};

App.Engine.Graphics.prototype.getRaycaster = function() {
    return new THREE.Raycaster();
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
            geometry = new THREE.PlaneGeometry(32, 32, 32, 32);
            break;

        case 'box':
            geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
            break;

        default:
            geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
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
            light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
            break;

        default:
            light = new THREE.AmbientLight(0x404040);
    }

    return light;
};

App.Engine.Graphics.prototype.loadTexture = function(whatTexture) {
    var texture = THREE.ImageUtils.loadTexture("app/assets/textures/"+whatTexture);

    texture.anisortopy = this.renderer.getMaxAnisotropy();

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    return texture;
};

/**
 * Gives
 * i+, j+, k+, i-, j-, k-
 */
App.Engine.Graphics.prototype.getTextureCoordinates = function() {
    return {
        '1': [[0, 1], [0, 1], [0, 2], [0, 1], [0, 1], [0, 0]], // Grass
        '2': [[5, 0], [5, 0], [5, 0], [5, 0], [5, 0], [5, 0]], // Stone
        '3': [[6, 0], [6, 0], [6, 0], [6, 0], [6, 0], [6, 0]], // Dirt
        '4': [[4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 0]], // Wood
        '5': [[7, 0], [7, 0], [7, 0], [7, 0], [7, 0], [7, 0]], // Planks
        '6': [[10, 0], [10, 0], [10, 0], [10, 0], [10, 0], [10, 0]], // Stone bricks
        '7': [[3, 0], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0]], // Bricks
        '8': [[14, 0], [14, 0], [14, 0], [14, 0], [14, 0], [14, 0]],  // Leaves (special)
        '17': [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]]  // Sand
    };
};
