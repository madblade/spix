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

extend(App.Model.Server.ChunkModel.prototype, {

    addWorld: function(worldId, worldInfo) {
        if (this.worlds.has(worldId)) {
            // console.log('This world I know... (' + typeof worldId +')');
            return;
        }

        console.log('This world I don\'t know... ' + worldId);
        var world = new Map();
        var properties = {
            chunkSizeX : worldInfo[0], // 16,
            chunkSizeY : worldInfo[1], // 16,
            chunkSizeZ : worldInfo[2]  // 32
        };

        properties.chunkCapacity = properties.chunkSizeX * properties.chunkSizeY * properties.chunkSizeZ;

        this.worlds.set(worldId, world);
        this.worldProperties.set(worldId, properties);

        return properties;
    },

    /** Dynamics **/

    init: function() {},

    refresh: function() {
        if (!this.needsUpdate) return;
        var graphics = this.app.engine.graphics;

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

                    // Add new world and matching scene.
                    var properties = this.addWorld(wid, wif);
                    if (properties) {
                        // 1 world <-> 1 scene, multiple cameras
                        graphics.addScene(wid);
                        var light = graphics.createLight('hemisphere');
                        light.position.set(0.5, 1, 0.75);
                        graphics.addToScene(light, wid);
                    }
                }
            }
            for (var worldId in updates) {
                if (worldId === 'worlds') {
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
    },

    updateChunks: function(updates) {
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
    },

    isChunkLoaded: function(worldId, chunkId) {
        var world = this.worlds.get(worldId);
        return (world && world.has(chunkId));
    },

    initializeChunk: function(worldId, chunkId, all) {
        var graphics = this.app.engine.graphics;

        // Initialize model if a new world is transmitted.
        var world = this.worlds.get(worldId);
        if (!world) {
            console.log('Got chunk ' + chunkId + ' ('+typeof worldId+') from an unknown world: ' + worldId);
            return;
        }

        var property = this.worldProperties.get(worldId);
        var sizeX = property.chunkSizeX;
        var sizeY = property.chunkSizeY;
        var sizeZ = property.chunkSizeZ;

        var chunk = graphics.createChunk(chunkId, all, sizeX, sizeY, sizeZ);
        world.set(chunkId, chunk);

        // Add to scene.
        if (!chunk || !chunk.hasOwnProperty('meshes')) {
            console.log('WARN. Update miss @ initializeChunk: ' + chunkId);
            console.log(all);
            return;
        }
        var meshes = chunk.meshes;
        for (var m = 0, l = meshes.length; m < l; ++m) {
            graphics.addToScene(meshes[m], worldId);
        }
    },

    updateChunk: function(worldId, chunkId, components) {
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

        graphics.updateChunk(worldId, chunk, chunkId, components, sizeX, sizeY, sizeZ);
    },

    unloadChunk: function(worldId, chunkId) {
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
            graphics.removeFromScene(meshes[m], worldId);
        }

        world.delete(chunkId);
    },

    getCloseTerrain: function(worldId) {
        // Only chunks within current world.

        // Get overworld by default. WARN security.
        if (!worldId) worldId = '-1';
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
    }

});
