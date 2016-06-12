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

        // Constants
        this._xSize = 8;
        this._ySize = 8;
        this._zSize = 256;
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
        var chunks = {};
        // TODO include a distance test.
        for (let eid in this._updatedChunks) {
            if (!this._updatedChunks.hasOwnProperty(eid) ||
                !this._chunks.hasOwnProperty(eid) ||
                !player.avatar.loadedChunks.hasOwnProperty(eid)) continue;

            let currentChunk = this._chunks[eid];
            chunks[currentChunk.chunkId] = currentChunk.surfaceBlocks;
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
        var chunks = {};

        // From player position, find concerned chunks.
        var av = player.avatar;
        const pos = av.position;

        // Belonging chunk coordinates.
        let coordinates = this.getChunkCoordinates(pos[0], pos[1], pos[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        // const k = coordinates[2];

        var chunkId = i+','+j;
        console.log(chunkId);
        if (!this._chunks.hasOwnProperty(chunkId)) {
            let chunk = Generator.generateFlatChunk(
                this.chunkDimensionX, this.chunkDimensionY, this.chunkDimensionZ, i, j);
            this._chunks[chunk.chunkId] = chunk;
        }

        let currentChunk = this._chunks[chunkId];
        chunks[chunkId] = currentChunk.surfaceBlocks;
        av.setChunkAsLoaded(chunkId);
        return chunks;
    }

    generate() {
        // TODO chrono and time out.
        return new Promise((resolve) => {
            this._chunks = Generator.generateFlatWorld(this._xSize, this._ySize, this._zSize);
            resolve();
        });
    }

    chunkUpdated(chunkId) {
        this._updatedChunks[chunkId] = true;
    }

    updateChunksTransmitted() {
        this._updatedChunks = {};
    }

    /**
     * Finds which chunk contains a given block.
     * @param x
     * @param y
     * @param z
     * @returns {*[]} coordinates of corresponding chunk.
     */
    getChunkCoordinates(x, y, z) {
        let i = x - ((x > 0 ? x : (this.chunkDimensionX-x)) % this.chunkDimensionX);
        i /= this.chunkDimensionX;
        let j = y - ((y > 0 ? y : (this.chunkDimensionY-y)) % this.chunkDimensionY);
        j /= this.chunkDimensionY;
        let k = z - ((z > 0 ? z : (this.chunkDimensionZ-z)) % this.chunkDimensionZ);
        k /= this.chunkDimensionZ;
        return [i,j,k];
    }

    addBlock(x, y, z, blockId) {
        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = this.getChunkCoordinates(x, y, z);
        const i = coordinates[0];
        const j = coordinates[1];
        const chunkX = x - i * this.chunkDimensionX;
        const chunkY = y - j * this.chunkDimensionY;

        const chunkId = i+'x'+j;
        var chunk = this._chunks[chunkId];
        if (!chunk || chunk === undefined) {
            console.log('Could not find chunk.');
            return;
        }

        // Add block on chunk.
        chunk.add(chunkX, chunkY, z, blockId);

        // Remember this chunk was touched.
        this.chunkUpdated(chunkId);
    }

    delBlock(x, y, z) {

    }

    whatBlock(x, y, z) {
        let coordinates = this.getChunkCoordinates(x, y, z);
        const i = coordinates[0];
        const j = coordinates[1];
        const chunkX = x - i * this.chunkDimensionX;
        const chunkY = y - j * this.chunkDimensionY;

        const chunkId = i+','+j;
        let chunk = this._chunks[chunkId];
        if (!chunk || chunk === undefined) {console.log('Could not find chunk.'); return;}
        return chunk.what(chunkX, chunkY, z);
    }

    getFreePosition() {
        let z = 48;
        while (this.whatBlock(0, 0, z) !== 0 && z < this._zSize) ++z;
        console.log(z);
        return [0, 0, z];
    }

}

export default WorldManager;
