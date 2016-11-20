/**
 *
 */

'use strict';

App.Model.Server.ChunkModel = function(app) {
    this.app = app;

    // Model component
    this.chunks = new Map();

    this.chunkSizeX = 8;
    this.chunkSizeY = 8;
    this.chunkSizeZ = 256;
    this.chunkCapacity = this.chunkSizeX * this.chunkSizeY * this.chunkSizeZ;

    // Graphical component
    var graphics = app.engine.graphics;
    this.needsUpdate = false;
    this.texture = graphics.loadTexture('atlas_512.png');
    this.textureCoordinates = graphics.getTextureCoordinates();
};

App.Model.Server.ChunkModel.prototype.init = function() {};

App.Model.Server.ChunkModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var graphics = this.app.engine.graphics;
};

App.Model.Server.ChunkModel.prototype.updateChunks = function(chunks) {
    // TODO parse
};

App.Model.Server.ChunkModel.prototype.getCloseTerrain = function() {
    var meshes = [];
    var chks = this.chunks;
    chks.forEach(function(currentChunk) {
        // TODO extract on 4 closest chunks.
        if (!currentChunk.meshes) {
            console.log("Warn: corrupted chunk inside client model " + cid);
            return;
        }
        currentChunk.meshes.forEach(function(mesh) {meshes.push(mesh)});
    });
    return meshes;
};
