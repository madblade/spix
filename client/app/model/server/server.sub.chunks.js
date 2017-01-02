/**
 *
 */

'use strict';

App.Model.Server.ChunkModel = function(app) {
    this.app = app;

    // Model component
    this.chunks = new Map();
    this.chunkUpdates = [];

    this.chunkSizeX = 16;
    this.chunkSizeY = 16;
    this.chunkSizeZ = 32;
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

        for (var worldId in updates) {
            if (worldId !== '-1') {
                console.log(worldId + ' not supported yet: another world.');
                continue;
            }

            var subdates = updates[worldId];
            for (var chunkId in subdates) {
                var update = subdates[chunkId];

                if (!update){
                    this.unloadChunk(chunkId);
                }
                else if (this.isChunkLoaded(chunkId)) {
                    // TODO [HIGH] server-side, use distinct channels for chunk updates.
                    if (update.length != 3) {
                        console.log('WARN: corrupt update or model @refresh / updateChunk.');
                        console.log(update);
                        return;
                    } else {
                        this.updateChunk(chunkId, update);
                    }
                }
                else {
                    if (update.length != 2) {
                        console.log('WARN: corrupt update or model @refresh / initChunk.');
                        console.log(update);
                        return;
                    } else {
                        this.initializeChunk(chunkId, update);
                    }
                }
            }
        }
    }

    this.chunkUpdates = [];
    this.needsUpdate = false;
};

App.Model.Server.ChunkModel.prototype.updateChunks = function(updates) {
    if (!updates) return;

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

App.Model.Server.ChunkModel.prototype.initializeChunk = function(chunkId, all) {
    var graphics = this.app.engine.graphics;

    // TODO use graphics in refresh
    var chunk = graphics.initializeChunk(chunkId, all, this.chunkSizeX, this.chunkSizeY, this.chunkSizeZ, this.chunkCapacity);
    this.chunks.set(chunkId, chunk);

    // Add to scene.
    if (!chunk || !chunk.hasOwnProperty('meshes')) {
        console.log('WARN. Update miss @ initializeChunk: ' + chunkId);
        console.log(all);
        return;
    }
    var meshes = chunk.meshes;
    for (var m = 0, l = meshes.length; m < l; ++m) {
        graphics.addToScene(meshes[m], -1); // TODO [CRIT] couple with knot model.
    }
};

App.Model.Server.ChunkModel.prototype.updateChunk = function(chunkId, components) {
    var graphics = this.app.engine.graphics;
    var chunk = this.chunks.get(chunkId);
    if (!chunk) return;

    // TODO use graphics in refresh
    graphics.updateChunk(chunk, chunkId, components, this.chunkSizeX, this.chunkSizeY, this.chunkSizeZ);
};

App.Model.Server.ChunkModel.prototype.unloadChunk = function(chunkId) {
    var graphics = this.app.engine.graphics;
    var chunk = this.chunks.get(chunkId);
    if (!chunk) {
        console.log('WARN. Update miss @unloadChunk ' + chunkId);
        return;
    }

    var meshes = chunk.meshes;
    for (var m = 0, l = meshes.length; m < l; ++m) {
        graphics.removeFromScene(meshes[m]);
    }

    this.chunks.delete(chunkId);
};

App.Model.Server.ChunkModel.prototype.getCloseTerrain = function() {
    var meshes = [];
    var chks = this.chunks;
    chks.forEach(function(currentChunk, cid) {
        // TODO extract on 4 closest chunks.
        if (!currentChunk || !currentChunk.hasOwnProperty('meshes')) {
            console.log("Warn: corrupted chunk inside client model " + cid);
            console.log(chks);
            return;
        }
        currentChunk.meshes.forEach(function(mesh) {meshes.push(mesh)});
    });
    return meshes;
};
