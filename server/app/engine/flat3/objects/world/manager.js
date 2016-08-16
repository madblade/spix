/**
 *
 */

'use strict';

import Generator from './generation/generator';
import Factory from './factory';
import UpdaterAPI from './update/updateapi'

class WorldManager {

    constructor() {
        // Objects.
        /**
         * Chunk id (i+','+j) -> chunk
         */
        this._chunks = {};

        // Keep track of modified objects.
        this._updatedChunks = {};

        // Constants
        this._xSize = 8;
        this._ySize = 8;
        this._zSize = 256;

        // Entity bus
        this._entityman = null;
    }

    get allChunks() { return this._chunks; }
    get chunkDimensionX() { return this._xSize; }
    get chunkDimensionY() { return this._ySize; }
    get chunkDimensionZ() { return this._zSize; }

    set allChunks(newChunks) { this._chunks = newChunks; }
    set entityman(entityman) { this._entityman = entityman; }

    update() {
        // Update world.
    }

    get updatedChunks() {
        var updatedChuks = [];
        for (var id in this._updatedChunks) {
            updatedChuks[id] = this._chunks[id].blocks;
        }
        return updatedChuks;
    }

    extractUpdatedChunks(player) {
        var chunks = {};
        // TODO include a distance test.
        for (let eid in this._updatedChunks) {
            if (!this._chunks.hasOwnProperty(eid) ||
                !player.avatar.loadedChunks.hasOwnProperty(eid)) continue;

            let currentChunk = this._chunks[eid];
            chunks[currentChunk.chunkId] = currentChunk.updates;
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
            if (!this._chunks.hasOwnProperty(eid)) continue;
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
        const k = coordinates[2];

        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        let chunkIds = [];
        chunkIds.push((i+','+j), (i-1+','+j), (i+','+(j-1)), ((i-1)+','+(j-1)));

        for (let chunkIdId = 0; chunkIdId<chunkIds.length; ++chunkIdId) {
            let currentChunkId = chunkIds[chunkIdId];
            if (!this._chunks.hasOwnProperty(currentChunkId)) {
                console.log("We should generate " + currentChunkId + " for the user.");
                let chunk = Generator.generateFlatChunk(dx, dy, dz, currentChunkId, this); // virtual polymorphism
                this._chunks[chunk.chunkId] = chunk;
            }

            let currentChunk = this._chunks[currentChunkId];
            if (!currentChunk.ready) {
                console.log("We should extract faces from " + currentChunkId + ".");
                currentChunk.computeFaces();
            }

            chunks[currentChunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
        }

        return chunks;
    }

    addChunk(id, chunk) {
        this._chunks[id] = chunk;
    }

    generate() {
        // TODO chrono and time out.
        return new Promise((resolve) => {

            // Generate blocks.
            this._chunks = Generator.generateFlatWorld(this._xSize, this._ySize, this._zSize, this);

            // Finalize chunks (extract surface faces)
            for (let cid in this._chunks) {
                this._chunks[cid].computeFaces();
            }

            // Notify
            resolve();
        });
    }

    chunkUpdated(chunkId) {
        this._updatedChunks[chunkId] = true;
    }

    updateChunksTransmitted() {
        for (let chunkId in this._updatedChunks) {
            this._chunks[chunkId].flushUpdates();
        }
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
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        let i = x - ((x >= 0 ? x : (dx + x)) % dx);
        i /= dx;

        let j = y - ((y >= 0 ? y : (dy + y)) % dy);
        j /= dy;

        let k = z - ((z >= 0 ? z : (dz + z)) % dz);
        k /= dz;

        return [i,j,k];
    }

    addBlock(originEntity, x, y, z, blockId) {
        UpdaterAPI.addBlock(originEntity, x, y, z, blockId, this, this._entityman);
    }

    delBlock(originEntity, x, y, z) {
        UpdaterAPI.delBlock(originEntity, x, y, z, this, this._entityman);
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
        return [0, 0, z];
    }

    getChunk(iCoordinate, jCoordinate) {
        let id = iCoordinate+','+jCoordinate;
        return this._chunks[id];
    }

    isChunkLoaded(iCoordinate, jCoordinate) {
        let chunk = this.getChunk(iCoordinate, jCoordinate);
        return chunk === null || chunk === undefined;
    }

    isEmpty(positionArray) {
        // TODO collide with blocks.
        let cs = this._chunks;
        return true;
    }

    hasPlayerNewChunksInRange(player) {
        return false;
    }

    extractNewChunksInRangeFor(player) {
        return this._chunks;
    }

}

export default WorldManager;
