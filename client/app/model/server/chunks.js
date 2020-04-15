/**
 *
 */

'use strict';

/** Model **/

import extend           from '../../extend.js';
import { Vector3 }      from 'three';

const WorldType = Object.freeze({
    FLAT: 0, // Symbol('flat'),
    CUBE: 1, // Symbol('cube'),
    SHRIKE: 2, // Symbol('shrike'),
    UNSTRUCTURED: 3 // Symbol('unstructured')
});

let ChunkModel = function(app) {
    this.app = app;

    // Model component.
    this.worlds = new Map();
    this.worldProperties = new Map();
    this.chunkUpdates = [];

    // Whatever lies between.
    this.skies = new Map();

    // Graphical component.
    this.needsUpdate = false;
    this.debug = false;
};

extend(ChunkModel.prototype, {

    hasWorld(worldId) {
        return this.worlds.has(worldId);
    },

    addWorldIfNotPresent(worldId, worldInfo, worldInfoMeta)
    {
        // console.log('This world I don\'t know... ' + worldId);
        let world = new Map();
        let properties = {
            chunkSizeX : worldInfo[0], // 16,
            chunkSizeY : worldInfo[1], // 16,
            chunkSizeZ : worldInfo[2],  // 32
            type : worldInfoMeta[0],
            radius : worldInfoMeta[1],
            center : {
                x: worldInfoMeta[2], y: worldInfoMeta[3], z: worldInfoMeta[4]
            }
        };

        properties.chunkCapacity =
            properties.chunkSizeX * properties.chunkSizeY * properties.chunkSizeZ;

        this.worlds.set(worldId, world);
        this.worldProperties.set(worldId, properties);

        return properties;
    },

    /**
     * @deprecated
     */
    addPlanet(worldId, worldInfo) {
        if (!worldInfo)
            console.log('[Chunks] Default sky creation.');

        let graphics = this.app.engine.graphics;
        let p = graphics.createPlanet();
        graphics.addToScene(p.planet, worldId);
        graphics.addToScene(p.atmosphere.mesh, worldId);
    },

    // TODO [MILESTONE1] make sky creation api serverwise
    // or seed behaviour
    addSky(worldId)
    {
        let worldMeta = this.worldProperties.get(worldId);
        if (!worldMeta)
            console.log('[Chunks] Default sky creation.');

        let graphics = this.app.engine.graphics;

        let sunPosition = new Vector3(0, -700000, 0);
        let sky;

        let skyType = worldMeta.type;

        if (skyType === WorldType.CUBE) {
            if (!worldMeta.center || !worldMeta.radius) {
                console.error('[Chunks/NewSky]: No center and radius specified.');
                return;
            }
            if (worldMeta.chunkSizeX !== worldMeta.chunkSizeY ||
                worldMeta.chunkSizeX !== worldMeta.chunkSizeZ) {
                console.error('[Chunks/NewSky]: Cube world must have cube chunks.');
                return;
            }
            let chunkSize = worldMeta.chunkSizeX;
            let center = new Vector3(
                (worldMeta.center.x + 0.5) * chunkSize,
                (worldMeta.center.y + 0.5) * chunkSize,
                (worldMeta.center.z + 0.5) * chunkSize);
            let radius = Math.max(worldMeta.radius, 1) * chunkSize;

            sky = graphics.createCubeSky(center, radius);
            // let sunSphere = graphics.createSunSphere();
            graphics.addToScene(sky.mesh, worldId);
            graphics.addToScene(sky.helper, worldId);
            // graphics.addToScene(sunSphere, worldId);

            // TODO [LOW] sky as seen from space
            // turbidity = 1
            // rayleigh = 0.25   or 0.5 and mieCoeff = 0.0
            // mieDirectionalG = 0.0
            graphics.updateSky(
                sky.mesh,
                sunPosition,
                10,
                2,
                0.005,
                0.8,
                1.0,
                -0.15, // 0.49; // elevation / inclination
                0.0, // Facing front
                true // isSunSphereVisible
            );
        } else if (skyType === WorldType.FLAT) {
            sky = graphics.createFlatSky();
            graphics.addToScene(sky.mesh, worldId);
            graphics.updateSky(
                sky.mesh,
                sunPosition,
                10,
                2,
                0.005,
                0.8,
                1.0,
                -0.15, // 0.49; // elevation / inclination
                0.0, // Facing front
                true // isSunSphereVisible
            );
        } else {
            console.error('Unsupported sky type.');
            return;
        }

        this.skies.set(worldId, sky);
    },

    // TODO [MILESTONE1] make sky update api serverwise
    // or seed behaviour
    updateSky(worldId, worldInfo) {
        if (!worldInfo)
            console.log('[Chunks] Warn! Nothing to update in the sky.');

        let currentSky = this.skies.get(worldId);
        if (!currentSky)
            console.log('[Chunks] Warn! Could not get required sky.');
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
                let worldsMeta = updates.worldsMeta;
                for (let wid in worlds) {
                    if (!worlds.hasOwnProperty(wid)) continue;

                    let wif = worlds[wid];
                    for (let id = 0, wl = wif.length; id < wl; ++id)
                        wif[id] = parseInt(wif[id], 10);

                    // Add new world and matching scene.
                    if (this.hasWorld(wid)) {
                        // console.log(`Update for a world I already have: ${wid}.`);
                        continue;
                    }

                    if (!worldsMeta || !worldsMeta.hasOwnProperty(wid)) {
                        console.error(`NO METADATA FOR NEW WORLD: ${wid}.`);
                        continue;
                    }
                    let wifm = worldsMeta[wid];
                    this.addWorldIfNotPresent(wid, wif, wifm);

                    // 1 world <-> 1 scene, multiple cameras
                    graphics.addScene(wid);

                    // TODO AO light
                    let light = graphics.createLight('hemisphere');
                    light.position.set(0.5, 1, 0.75);
                    light.updateMatrixWorld();
                    graphics.addToScene(light, wid);

                    this.addSky(wid);

                    // this.addPlanet(wid, wif);
                }
            }

            for (let worldId in updates) {
                if (!updates.hasOwnProperty(worldId) ||
                    worldId === 'worlds' || worldId === 'worldsMeta')
                    continue;

                let subdates = updates[worldId];
                let sup = {};

                for (let chunkId in subdates) {
                    if (!subdates.hasOwnProperty(chunkId)) continue;

                    let update = subdates[chunkId];

                    if (!update) {
                        this.unloadChunk(worldId, chunkId);
                    }

                    else if (this.isChunkLoaded(worldId, chunkId) && update.length === 3) {
                        this.updateChunk(worldId, chunkId, update);
                    }

                    else if (this.isChunkLoaded(worldId, chunkId) && update.length !== 3) {
                        // TODO [HIGH] server-side, use distinct channels for chunk updates.
                        console.error(`WARN: corrupt update or model @refresh / updateChunk ${chunkId}.`);
                        console.log(update);
                        this.chunkUpdates = [];
                        return;
                    }

                    // Non-loaded chunk.
                    else if (update.length !== 2) {
                        console.error('WARN: corrupt update or model @refresh / initChunk.');
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
            console.error(`Got chunk ${chunkId} (${typeof worldId}) from an unknown world: ${worldId}`);
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
            console.error(`WARN. Update miss @ initializeChunk: ${chunkId}`);
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

            currentChunk.meshes.forEach(function(mesh) {
                if (!!mesh && !!mesh.geometry) { // empty chunk or geometry
                    meshes.push(mesh);
                }
            });
        });

        return meshes;
    },

    cleanup() {
        this.worlds.forEach(w => {
            w.forEach(currentChunk => {
                if (!!currentChunk && currentChunk.hasOwnProperty('meshes')) {
                    currentChunk.meshes.forEach(mesh => {
                        mesh.geometry.dispose();
                        mesh.material.dispose();
                    });
                }
            });
            w.clear();
        });
        this.worlds.clear();
        this.worldProperties.clear();
        this.chunkUpdates = [];

        // Sky collection.
        this.skies.forEach(s => {
            if (s.mesh) {
                s.mesh.geometry.dispose();
                s.mesh.material.dispose();
            }
            if (s.helper && s.helper.mesh) {
                s.helper.mesh.geometry.dispose();
                s.helper.mesh.material.dispose();
            }
        });
        this.skies.clear();

        // Graphical component.
        this.needsUpdate = false;
        this.debug = false;
        // TODO [LEAK] cleanup graphical component and all meshes.
    }
});

export { ChunkModel };
