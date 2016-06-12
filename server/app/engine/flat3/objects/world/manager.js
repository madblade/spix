/**
 *
 */

'use strict';

import Generator from './generator';
import Factory from '../world/factory';

class WorldManager {

    constructor() {
        // Objects.
        this._chunks = {};

        // Keep track of modified objects.
        this._updatedChunks = {};
    }

    update() {
        // Update world.
    }

    get allChunks() { return this._chunks; }
    get chunkDimensionX() { return this._xSize; }
    get chunkDimensionY() { return this._ySize; }
    get chunkDimensionZ() { return this._zSize; }

    get updatedChunks() {
        var updatedChuks = [];
        for (var id in this._updatedChunks) {
            if (!this._updatedChunks.hasOwnProperty(id)) continue;
            updatedChuks[id] = this._chunks[id].blocks;
        }
        return updatedChuks;
    }

    extractUpdatedChunks(player) {
        var chunks = [];
        // TODO include a distance test.
        for (var eid in this._updatedChunks) {
            if (!this._updatedChunks.hasOwnProperty(eid) ||
                !this._chunks.hasOwnProperty(eid) ||
                !player.avatar.loadedChunks.hasOwnProperty(eid)) continue;

            chunks.push(this._chunks[eid]);
        }
        return chunks;
    }

    extractChunksInRange(player) {
        var chunks = [];

        // From player position, find concerned chunks.
        var av = player.avatar;
        const pos = av.position;

        // Belonging chunk coordinates.
        const x = Math.floor(pos[0]); const i = (x - x % this.chunkDimensionX) / this.chunkDimensionX;
        const y = Math.floor(pos[1]); const j = (y - y % this.chunkDimensionY) / this.chunkDimensionY;
        const z = Math.floor(pos[2]); const k = (z - z % this.chunkDimensionZ) / this.chunkDimensionZ;
        // (Dreaming of cubic chunks)

        var ld = [];
        for (var eid in av.loadedChunks) {
            if (!av.loadedChunks.hasOwnProperty(eid) || !this._chunks.hasOwnProperty(eid)) continue;
            ld.push(eid);
        }
        // TODO check which chunks remain to load, and load them.
        // TODO give a bit more smartness to avatar (knows which chunks to check).

        return chunks;
    }

    extractChunksForNewPlayer(player) {
        var chunks = [];

        // From player position, find concerned chunks.
        var av = player.avatar;
        const pos = av.position;

        // Belonging chunk coordinates.
        const x = Math.floor(pos[0]); const i = (x - x % this.chunkDimensionX) / this.chunkDimensionX;
        const y = Math.floor(pos[1]); const j = (y - y % this.chunkDimensionY) / this.chunkDimensionY;
        const z = Math.floor(pos[2]); const k = (z - z % this.chunkDimensionZ) / this.chunkDimensionZ;

        var chunkId = i+','+j;
        if (!this._chunks.hasOwnProperty(chunkId)) {
            this._chunks[chunkId] = Generator.generateFlatChunk(
                this.chunkDimensionX, this.chunkDimensionY, this.chunkDimensionZ, chunkId);
        }

        chunks.push(this._chunks[chunkId]);
        av.setChunkAsLoaded(chunkId);

        return chunks;
    }

    generate() {
        // TODO chrono and time out.
        return new Promise((resolve) => {
            this._chunks = Generator.generateFlatWorld();
            resolve();
        });
    }

    chunkUpdated(chunkId) {
        this._updatedChunks[chunkId] = true;
    }

    updateChunksTransmitted() {
        this._updatedChunks = {};
    }

    addBlock(x, y, z, blockId) {
        // Translate coordinates into chunk coordinates.
        const chunkX = x % 8;
        const chunkY = y % 8;

        // Find chunk.
        const chunkI = (x - chunkX) / 8;
        const chunkJ = (y - chunkY) / 8;
        const chunkId = chunkI+'x'+chunkJ;
        var chunk = this._chunks[chunkId];
        if (!chunk || chunk === undefined) {
            console.log('Could not find chunk.');
            return;
        }

        // Add block on chunk.
        chunk.add(chunkX, chunkY, z, blockId);

        // Remember this chunk was touched.
        chunkUpdated(chunkId);
    }

    delBlock(x, y, z) {

    }

    whatBlock(x, y, z) {

    }

}

export default WorldManager;
