/**
 *
 */

'use strict';

App.Model.Server.ChunkModel = function(app) {
    this.app = app;

    // Model component
    this.chunks = new Map();
    this.chunkUpdates = [];

    this.chunkSizeX = 8;
    this.chunkSizeY = 8;
    this.chunkSizeZ = 256;
    this.chunkCapacity = this.chunkSizeX * this.chunkSizeY * this.chunkSizeZ;

    // Graphical component
    var graphics = app.engine.graphics;
    this.needsUpdate = false;
    this.debug = false;

    this.texture = graphics.loadTexture('atlas_512.png');
    this.textureCoordinates = graphics.getTextureCoordinates();
};

App.Model.Server.ChunkModel.prototype.init = function() {};

App.Model.Server.ChunkModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;

    var chunkUpdates = this.chunkUpdates;
    for (var cu = 0, l = chunkUpdates.length; cu < l; ++cu) {
        var updates = chunkUpdates[cu];

        for (var chunkId in updates) {
            if (updates[chunkId] === null)
                this.unloadChunk(chunkId);
            else if (this.isChunkLoaded(chunkId))
                this.updateChunk(chunkId, updates[chunkId]);
            else
                this.initChunk(chunkId, updates[chunkId]);
        }
    }

    this.chunkUpdates = [];
    this.needsUpdate = false;
};

App.Model.Server.ChunkModel.prototype.updateChunks = function(updates) {
    if (this.debug) {
        console.log(updates);
        var nbcc = 0;
        for (var cid in updates) { if (updates[cid][1][1]!==undefined) nbcc += updates[cid][1][1].length; }
        console.log(nbcc);
    }

    // Stack updates, waiting for collector to refresh model.
    this.chunkUpdates.push(updates);
    this.needsUpdate = true;
};

App.Model.Server.ChunkModel.prototype.isChunkLoaded = function(chunkId) {
    return this.chunks.has(chunkId);
};

App.Model.Server.ChunkModel.prototype.initChunk = function(chunkId, all) {
    var graphics = this.app.engine.graphics;

    // TODO use graphics in refresh
    var chunk = graphics.initChunk(chunkId, all, this.chunkSizeX, this.chunkSizeY, this.chunkSizeZ, this.chunkCapacity);
    this.chunks.set(chunkId, chunk);

    // Add to scene.
    var meshes = chunk.meshes;
    for (var m = 0, l = meshes.length; m < l; ++m) {
        graphics.scene.add(meshes[m]);
    }
};

App.Model.Server.ChunkModel.prototype.updateChunk = function(chunkId, components) {
    var graphics = this.app.engine.graphics;
    var chunk = this.chunks.get(chunkId);
    if (chunk === undefined) return;

    // TODO use graphics in refresh
    graphics.updateChunk(chunk, chunkId, components, this.chunkSizeX, this.chunkSizeY, this.chunkSizeZ);
};

App.Model.Server.ChunkModel.prototype.unloadChunk = function(chunkId) {
    var graphics = this.app.engine.graphics;

    var meshes = this.chunks.get(chunkId).meshes;
    for (var m = 0, l = meshes.length; m < l; ++m) {
        graphics.scene.remove(meshes[m]); // TODO put in refresh
    }

    this.chunks.delete(chunkId);
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
