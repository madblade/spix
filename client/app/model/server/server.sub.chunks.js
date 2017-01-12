/**
 *
 */

'use strict';

/** Model **/

App.Model.Server.ChunkModel = function(app) {
    this.app = app;

    // Model component.
    this.worlds = new Map();
    this.worldProperties = new Map();
    this.chunkUpdates = [];

    // Initialize overworld.
    // this.addWorld(-1);

    // Graphical component
    var graphics = app.engine.graphics;
    this.needsUpdate = false;
    this.debug = false;

    this.texture = graphics.loadTexture('atlas_512.png');
    this.textureCoordinates = graphics.getTextureCoordinates();
};

App.Model.Server.ChunkModel.prototype.addWorld = function(worldId, worldInfo) {
    if (this.worlds.has(worldId)) {
        // console.log('This world I know... (' + typeof worldId +')');
        return;
    }

    console.log('This world I don\'t know... ' + worldId);
    var world = new Map();
    var property = {
        chunkSizeX : worldInfo[0], // 16,
        chunkSizeY : worldInfo[1], // 16,
        chunkSizeZ : worldInfo[2]  // 32
    };

    property.chunkCapacity = property.chunkSizeX * property.chunkSizeY * property.chunkSizeZ;

    this.worlds.set(worldId, world);
    this.worldProperties.set(worldId, property);
};

/** Dynamics **/

App.Model.Server.ChunkModel.prototype.init = function() {};

App.Model.Server.ChunkModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;

    var chunkUpdates = this.chunkUpdates;
    for (var cu = 0, l = chunkUpdates.length; cu < l; ++cu) {
        var updates = chunkUpdates[cu];

        if ('worlds' in updates) {
            //console.log('World metadata:');
            //console.log(updates['worlds']);
            var worlds = updates['worlds'];
            for (var wid in worlds) {
                var wif = worlds[wid];
                for (var id = 0, wl=wif.length; id<wl; ++id) wif[id] = parseInt(wif[id]);
                this.addWorld(wid, wif);
            }
        }
        for (var worldId in updates) {
            if (worldId === 'worlds') {
                continue;
            }
            if (worldId !== '-1') {
                console.log(worldId + ' not supported yet: another world.');
                continue;
            }

            var subdates = updates[worldId];
            for (var chunkId in subdates) {
                var update = subdates[chunkId];

                if (!update){
                    this.unloadChunk(worldId, chunkId);
                }
                else if (this.isChunkLoaded(worldId, chunkId)) {
                    // TODO [HIGH] server-side, use distinct channels for chunk updates.
                    if (update.length != 3) {
                        console.log('WARN: corrupt update or model @refresh / updateChunk.');
                        console.log(update);
                        this.chunkUpdates = [];
                        return;
                    } else {
                        this.updateChunk(worldId, chunkId, update);
                    }
                }
                else {
                    if (update.length != 2) {
                        console.log('WARN: corrupt update or model @refresh / initChunk.');
                        console.log(update);
                        return;
                    } else {
                        this.initializeChunk(worldId, chunkId, update);
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
        for (var cid in updates) { if (updates[cid][1][1]) nbcc += updates[cid][1][1].length; }
        console.log(nbcc);
    }

    // Stack updates, waiting for collector to refresh model.
    this.chunkUpdates.push(updates);
    this.needsUpdate = true;
};

// TODO [CRIT] worldify
App.Model.Server.ChunkModel.prototype.isChunkLoaded = function(worldId, chunkId) {
    var world = this.worlds.get(worldId);
    return (world && world.has(chunkId));
};

// TODO [CRIT] couple with knot model.
App.Model.Server.ChunkModel.prototype.initializeChunk = function(worldId, chunkId, all) {
    var graphics = this.app.engine.graphics;

    // Initialize model if a new world is transmitted.
    var world = this.worlds.get(worldId);
    if (!world) {
        console.log('Got chunk ' + chunkId + ' ('+typeof worldId+') from an unknown world: ' + worldId);
        return;
        // this.addWorld(worldId);
        // world = this.worlds.get(worldId);
    }

    var property = this.worldProperties.get(worldId);
    var sizeX = property.chunkSizeX;
    var sizeY = property.chunkSizeY;
    var sizeZ = property.chunkSizeZ;

    // TODO use graphics in refresh
    var chunk = graphics.initializeChunk(chunkId, all, sizeX, sizeY, sizeZ);
    world.set(chunkId, chunk);

    // Add to scene.
    if (!chunk || !chunk.hasOwnProperty('meshes')) {
        console.log('WARN. Update miss @ initializeChunk: ' + chunkId);
        console.log(all);
        return;
    }
    var meshes = chunk.meshes;
    for (var m = 0, l = meshes.length; m < l; ++m) {
        graphics.addToScene(meshes[m], -1); // TODO [CRIT] link scene
    }
};

// TODO [CRIT] worldify
App.Model.Server.ChunkModel.prototype.updateChunk = function(worldId, chunkId, components) {
    var graphics = this.app.engine.graphics;

    var world = this.worlds.get(worldId);
    if (!world) {
        console.log('Error: updateChunk trying to access unloaded world.');
        return;
    }
    var property = this.worldProperties.get(worldId);

    var chunk = world.get(chunkId);
    if (!chunk) {
        console.log('Error: updateChunk trying to update unloaded chunk.');
        return;
    }

    var sizeX = property.chunkSizeX;
    var sizeY = property.chunkSizeY;
    var sizeZ = property.chunkSizeZ;

    // TODO use graphics in refresh
    graphics.updateChunk(chunk, chunkId, components, sizeX, sizeY, sizeZ);
};

// TODO [CRIT] worldify
App.Model.Server.ChunkModel.prototype.unloadChunk = function(worldId, chunkId) {
    var graphics = this.app.engine.graphics;
    var world = this.worlds.get(worldId);
    if (!world) return;

    var chunk = world.get(chunkId);
    if (!chunk) {
        console.log('WARN. Update miss @unloadChunk ' + chunkId);
        return;
    }

    var meshes = chunk.meshes;
    for (var m = 0, l = meshes.length; m < l; ++m) {
        graphics.removeFromScene(meshes[m], -1); // TODO [CRIT] worldify
    }

    world.delete(chunkId);
};

// TODO [CRIT] worldify
App.Model.Server.ChunkModel.prototype.getCloseTerrain = function(worldId) {
    // Only chunks within current world.
    if (!worldId) worldId = '-1'; // Get overworld by default TODO [LOW] check security
    var world = this.worlds.get(worldId);
    if (!world) return;

    var meshes = [];
    world.forEach(function(currentChunk, cid) {
        // TODO extract on 4 closest chunks.
        if (!currentChunk || !currentChunk.hasOwnProperty('meshes')) {
            console.log("Warn: corrupted chunk inside client model " + cid);
            console.log(world);
            return;
        }

        currentChunk.meshes.forEach(function(mesh) {meshes.push(mesh)});
    });

    return meshes;
};
