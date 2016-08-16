/**
 *
 */

'use strict';

import WorldGenerator from './generation/worldgenerator';
import UpdateAPI from './update/updateapi'
import ExtractionAPI from './extraction/extractionapi'

class WorldManager {

    constructor() {
        // Objects.
        /**
         * Chunk id (i+','+j) -> chunk
         */
        this._chunks = {};

        // Keep track of modified objects.
        this._updatedChunks = {};

        // Keep same generation method
        this._generationMethod = "flat";

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
    get generationMethod() { return this._generationMethod; }

    set allChunks(newChunks) { this._chunks = newChunks; }
    set entityman(entityman) { this._entityman = entityman; }
    set generationMethod(newGenerationMethod) { this._generationMethod = newGenerationMethod; }

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

    extractUpdatedChunksForPlayer(player) {
        return ExtractionAPI.computeUpdatedChunksForPlayer(player, this._chunks, this._updatedChunks);
    }

    hasPlayerNewChunksInRange(player) {
        return false;
    }

    extractNewChunksInRangeForPlayer(player) {
        return ExtractionAPI.computeNewChunksInRangeForPlayer(player, this);
    }

    // API Entry Point
    extractChunksForNewPlayer(player) {
        return ExtractionAPI.computeChunksForNewPlayer(player, this);
    }

    addChunk(id, chunk) {
        this._chunks[id] = chunk;
    }

    // API Entry Point
    generate() {
        // TODO chrono and time out.
        return new Promise(resolve => {

            // Generate blocks.
            this._chunks = WorldGenerator.generateFlatWorld(this._xSize, this._ySize, this._zSize, this);

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

    chunkUpdatesTransmitted() {
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
        UpdateAPI.addBlock(originEntity, x, y, z, blockId, this, this._entityman);
    }

    delBlock(originEntity, x, y, z) {
        UpdateAPI.delBlock(originEntity, x, y, z, this, this._entityman);
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

}

export default WorldManager;
