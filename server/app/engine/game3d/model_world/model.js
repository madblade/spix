/**
 *
 */

'use strict';

import WorldGenerator from './generation/worldgenerator';
import UpdateAPI from './update/updateapi'
import ExtractionAPI from './extraction/extractionapi'

class WorldManager {

    constructor(gameId) {
        // Objects.

        // Chunk id (i+','+j+','+k) -> chunk
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
        this._entityModel = null;

        // Handle
        this._handle = gameId;
    }

    get handle() { return this._handle; }
    get allChunks() { return this._chunks; }

    get chunkDimensionX() { return this._xSize; }
    get chunkDimensionY() { return this._ySize; }
    get chunkDimensionZ() { return this._zSize; }

    get generationMethod() { return this._generationMethod; }
    get entityman() { return this._entityModel; }

    set allChunks(newChunks) { this._chunks = newChunks; }
    set entityman(entityman) { this._entityModel = entityman; }
    set generationMethod(newGenerationMethod) { this._generationMethod = newGenerationMethod; }

    update() {
        // Update world
        // TODO defer updates when server loops in here.
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

    getChunkCoordinatesFromFloatingPoint(x, y, z, floorX, floorY, floorZ) {
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        const modX = (floorX >= 0 ? floorX : (dx + floorX)) % dx;
        const deltaX = modX === 0;

        const modY = (floorY >= 0 ? floorY : (dy + floorY)) % dy;
        const deltaY = modY === 0;

        const modZ = (floorZ >= 0 ? floorZ : (dz + floorZ)) % dz;
        const deltaZ = modZ === 0;

        const Dx = deltaX && UpdateAPI.isEpsilon(Math.abs(Math.abs(x)-Math.abs(floorX)));
        const Dy = deltaY && UpdateAPI.isEpsilon(Math.abs(Math.abs(y)-Math.abs(floorY)));
        const Dz = deltaZ && UpdateAPI.isEpsilon(Math.abs(Math.abs(z)-Math.abs(floorZ)));

        let ijk = this.getChunkCoordinates(x, y, z);

        return [ijk[0], ijk[1], ijk[2], Dx, Dy, Dz];
    }

    getChunkCoordinates(x, y, z) {
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        let f = Math.floor;
        let i = f(x/dx);
        let j = f(y/dy);
        let k = f(z/dz);

        return [i,j,k];
    }

    addBlock(originEntity, x, y, z, blockId) {
        UpdateAPI.addBlock(originEntity, x, y, z, blockId, this, this._entityModel);
    }

    delBlock(originEntity, x, y, z) {
        UpdateAPI.delBlock(originEntity, x, y, z, this, this._entityModel);
    }

    whatBlock(x, y, z) {
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        let coordinates = this.getChunkCoordinates(x, y, z);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];

        const chunkX = x - i * dx;
        const chunkY = y - j * dy;
        const chunkZ = z - k * dz;

        const chunkId = i+','+j+','+k;
        let chunk = this._chunks[chunkId];
        if (!chunk || chunk === undefined) {console.log('ChkMgr@whatBlock: could not find chunk ' + chunkId +
            ' from ' + x+','+y+','+z);
            // TODO load concerned chunk.
            // TODO check minus
            return;
        }
        return chunk.what(chunkX, chunkY, chunkZ);
    }

    getFreePosition() {
        let z = 150;
        while (this.whatBlock(4, 4, z) !== 0 && z < this._zSize) ++z;
        return [4.5, 4.5, z];
    }

    getChunk(iCoordinate, jCoordinate, kCoordinate) {
        let id = iCoordinate+','+jCoordinate+','+kCoordinate;
        return this._chunks[id];
    }

    isChunkLoaded(iCoordinate, jCoordinate) {
        let chunk = this.getChunk(iCoordinate, jCoordinate);
        return chunk === null || chunk === undefined;
    }

    isFree(p) {
        return this.whatBlock(p[0], p[1], p[2]) === 0; // && this.whatBlock(p[0], p[1], p[2]+1) === 0;
    }

}

export default WorldManager;
