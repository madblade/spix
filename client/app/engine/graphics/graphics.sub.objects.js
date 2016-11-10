/**
 *
 */

'use strict';

// Setup basic objects (terrain, avatar).
App.Engine.Graphics.prototype.initObjects = function() {

    // Semi-model objects
    this.light = null; // Only 1 for the moment.
    this.avatar = null;
    this.entities = {};
    this.chunks = {};
    this.displayAvatar = false;

    this.chunkSizeX = 8;
    this.chunkSizeY = 8;
    this.chunkSizeZ = 256;
    this.chunkCapacity = this.chunkSizeX * this.chunkSizeY * this.chunkSizeZ;

    // Lights
    this.light = this.getLight('hemisphere');
    this.light.position.set(0.5, 1, 0.75);

    // Textures
    this.texture = this.loadTexture('atlas_512.png');
    this.textureCoordinates = this.getTextureCoordinates();

    // Player
    this.avatar = this.getMesh(
        this.getGeometry('box'),
        this.getMaterial('flat-phong')
    );
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
