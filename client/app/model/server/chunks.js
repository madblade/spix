/**
 *
 */

'use strict';

/** Model **/

import extend           from '../../extend.js';

let ChunkModel = function(app) {
    this.app = app;

    // Model component.
    this.worlds = new Map();
    this.worldProperties = new Map();
    this.chunkUpdates = [];

    // Graphical component
    this.needsUpdate = false;
    this.debug = false;
};

extend(ChunkModel.prototype, {

    addWorld(worldId, worldInfo) {
        if (this.worlds.has(worldId)) {
            // console.log('This world I know... (' + typeof worldId +')');
            return;
        }

        // console.log('This world I don\'t know... ' + worldId);
        let world = new Map();
        let properties = {
            chunkSizeX : worldInfo[0], // 16,
            chunkSizeY : worldInfo[1], // 16,
            chunkSizeZ : worldInfo[2]  // 32
        };

        properties.chunkCapacity =
            properties.chunkSizeX * properties.chunkSizeY * properties.chunkSizeZ;

        this.worlds.set(worldId, world);
        this.worldProperties.set(worldId, properties);

        return properties;
    },

    /** Dynamics **/

    init() {},

    refresh() {
        if (!this.needsUpdate) return;
        let graphics = this.app.engine.graphics;
        // let clientModel = this.app.model.client;

        let chunkUpdates = this.chunkUpdates;
        let reportedUpdates = [];
        let mustReport = false;

        for (let cu = 0, l = chunkUpdates.length; cu < l; ++cu) {
            let updates = chunkUpdates[cu];
            let rup = {};

            if ('worlds' in updates) {
                //console.log('World metadata:');
                //console.log(updates['worlds']);
                let worlds = updates.worlds;
                for (let wid in worlds) {
                    let wif = worlds[wid];
                    for (let id = 0, wl = wif.length; id < wl; ++id)
                        wif[id] = parseInt(wif[id], 10);

                    // Add new world and matching scene.
                    let properties = this.addWorld(wid, wif);
                    if (properties) {
                        // 1 world <-> 1 scene, multiple cameras
                        graphics.addScene(wid);
                        let light = graphics.createLight('hemisphere');
                        light.position.set(0.5, 1, 0.75);
                        light.updateMatrixWorld();
                        graphics.addToScene(light, wid);
                    }
                }
            }

            for (let worldId in updates) {
                if (worldId === 'worlds') {
                    continue;
                }

                let subdates = updates[worldId];
                let sup = {};

                for (let chunkId in subdates) {
                    let update = subdates[chunkId];

                    if (!update) {
                        this.unloadChunk(worldId, chunkId);
                    }

                    else if (this.isChunkLoaded(worldId, chunkId) && update.length === 3) {
                        this.updateChunk(worldId, chunkId, update);
                    }

                    else if (this.isChunkLoaded(worldId, chunkId) && update.length !== 3) {
                        // TODO [HIGH] server-side, use distinct channels for chunk updates.
                        console.log('WARN: corrupt update or model @refresh / updateChunk.');
                        console.log(update);
                        this.chunkUpdates = [];
                        return;
                    }

                    // Non-loaded chunk.
                    else if (update.length !== 2) {
                        console.log('WARN: corrupt update or model @refresh / initChunk.');
                        console.log(update);
                        return;

                    // One per iteration...
                    } else if (!mustReport) {
                        //console.log('[Server/Chunk] One more time');
                        //console.log('[Server/Chunk] Initing');
                        this.initializeChunk(worldId, chunkId, update);
                        mustReport = true;
                    } else {
                        //console.log('[Server/Chunk] Reporting');
                        sup[chunkId] = update;
                    }
                }

                if (Object.keys(sup).length > 0) {
                    rup[worldId] = sup;
                }
            }

            if (Object.keys(rup).length > 0) {
                reportedUpdates.push(rup);
            }
        }

        this.chunkUpdates = reportedUpdates;
        if (reportedUpdates.length < 1)
            this.needsUpdate = false;
    },

    updateChunks(updates) {
        if (!updates) return;

        if (this.debug) {
            console.log(updates);
            let nbcc = 0;
            for (let cid in updates)
                if (updates[cid][1][1])
                    nbcc += updates[cid][1][1].length;
            console.log(nbcc);
        }

        // Stack updates, waiting for collector to refresh model.
        this.chunkUpdates.push(updates);
        this.needsUpdate = true;
    },

    isChunkLoaded(worldId, chunkId) {
        let world = this.worlds.get(worldId);
        return world && world.has(chunkId);
    },

    initializeChunk(worldId, chunkId, all) {
        let graphics = this.app.engine.graphics;

        // Initialize model if a new world is transmitted.
        let world = this.worlds.get(worldId);
        if (!world) {
            console.log(`Got chunk ${chunkId} (${typeof worldId}) from an unknown world: ${worldId}`);
            return;
        }

        let property = this.worldProperties.get(worldId);
        let sizeX = property.chunkSizeX;
        let sizeY = property.chunkSizeY;
        let sizeZ = property.chunkSizeZ;

        let chunk = graphics.createChunk(chunkId, all, sizeX, sizeY, sizeZ);
        world.set(chunkId, chunk);

        // Add to scene.
        if (!chunk || !chunk.hasOwnProperty('meshes')) {
            console.log(`WARN. Update miss @ initializeChunk: ${chunkId}`);
            console.log(all);
            return;
        }
        let meshes = chunk.meshes;
        for (let m = 0, l = meshes.length; m < l; ++m) {
            graphics.addToScene(meshes[m], worldId);
        }
    },

    updateChunk(worldId, chunkId, components) {
        let graphics = this.app.engine.graphics;

        let world = this.worlds.get(worldId);
        if (!world) {
            console.log('Error: updateChunk trying to access unloaded world.');
            return;
        }
        let property = this.worldProperties.get(worldId);

        let chunk = world.get(chunkId);
        if (!chunk) {
            console.log('Error: updateChunk trying to update unloaded chunk.');
            return;
        }

        let sizeX = property.chunkSizeX;
        let sizeY = property.chunkSizeY;
        let sizeZ = property.chunkSizeZ;

        graphics.updateChunk(worldId, chunk, chunkId, components, sizeX, sizeY, sizeZ);
    },

    unloadChunk(worldId, chunkId) {
        let graphics = this.app.engine.graphics;
        let world = this.worlds.get(worldId);
        if (!world) return;

        let chunk = world.get(chunkId);
        if (!chunk) {
            console.log(`WARN. Update miss @unloadChunk ${chunkId}`);
            return;
        }

        let meshes = chunk.meshes;
        for (let m = 0, l = meshes.length; m < l; ++m) {
            graphics.removeFromScene(meshes[m], worldId);
        }

        world.delete(chunkId);
    },

    getCloseTerrain(worldId) {
        // Only chunks within current world.

        // Get overworld by default. WARN security.
        if (!worldId) worldId = '-1';
        let world = this.worlds.get(worldId);
        if (!world) return;

        let meshes = [];
        world.forEach(function(currentChunk, cid) {
            // TODO extract on 4 closest chunks.
            if (!currentChunk || !currentChunk.hasOwnProperty('meshes')) {
                console.log(`Warn: corrupted chunk inside client model ${cid}`);
                console.log(world);
                return;
            }

            currentChunk.meshes.forEach(function(mesh) {meshes.push(mesh);});
        });

        return meshes;
    }

});

export { ChunkModel };
