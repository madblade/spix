/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.createRenderer = function() {
    // Configure renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setClearColor(0x435D74, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
};

App.Engine.Graphics.prototype.createScene = function() {
    return new THREE.Scene();
};

App.Engine.Graphics.prototype.removeObjectFromScene = function(object3D) {
    this.app.scene.remove(object3D);
    object3D.geometry.dispose();
    object3D.geometry = null;
    object3D.material.dispose();
    object3D.material = null;
};
