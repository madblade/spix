/**
 *
 */

'use strict';

// Setup basic objects (terrain, avatar).
App.Engine.Graphics.prototype.initObjects = function() {

    // Textures
    this.texture = this.loadTexture('atlas_512.png');
    this.textureCoordinates = this.getTextureCoordinates();
};

App.Engine.Graphics.prototype.positionCameraBehind = function(cameraWrapper, vector) {
    cameraWrapper.position.x = vector[0];
    cameraWrapper.position.y = vector[1]; // + 10;
    cameraWrapper.position.z = vector[2] + 1.2;
};

App.Engine.Graphics.prototype.removeObjectFromScene = function(object3D) {
    this.app.scene.remove(object3D);
    object3D.geometry.dispose();
    object3D.geometry = null;
    object3D.material.dispose();
    object3D.material = null;
};
