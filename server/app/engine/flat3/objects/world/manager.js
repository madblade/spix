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

        // Entity bus
        this._entityman = null;
    }

    set entityman(entityman) { this._entityman = entityman; }

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
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;
        console.log(chunkId);
        if (!this._chunks.hasOwnProperty(chunkId)) {
            let chunk = Generator.generateFlatChunk(dx, dy, dz, i, j);
            this._chunks[chunk.chunkId] = chunk;
        }

        let currentChunk = this._chunks[chunkId];
        chunks[chunkId] = [currentChunk.fastComponents, currentChunk.fastComponentsIds];
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
        for (let chunkId in this._updatedChunks) {
            if (this._updatedChunks.hasOwnProperty(chunkId))
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
        let i = x - ((x > 0 ? x : (this.chunkDimensionX-x)) % this.chunkDimensionX);
        i /= this.chunkDimensionX;
        let j = y - ((y > 0 ? y : (this.chunkDimensionY-y)) % this.chunkDimensionY);
        j /= this.chunkDimensionY;
        let k = z - ((z > 0 ? z : (this.chunkDimensionZ-z)) % this.chunkDimensionZ);
        k /= this.chunkDimensionZ;
        return [i,j,k];
    }

    static distance3(v1, v2) {
        let x = v1[0]-v2[0]; x*=x;
        let y = v1[1]-v2[1]; y*=y;
        let z = v1[2]-v2[2]; z*=z;
        return Math.sqrt(x+y+z);
    }

    static validateBlockEdition(originEntity, x, y, z, floors) {
        let fx = floors[0]; let fy = floors[1]; let fz = floors[2];
        // 4 blocks maximum range for block editing.
        const d3 = WorldManager.distance3(originEntity.position, [x, y, z]);
        console.log(d3 + " DISTANCE");
        return (d3 < 4);
    }

    translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk) {
        function failure() { console.log("Request denied."); }

        if (!WorldManager.validateBlockEdition(originEntity, x, y, z, floors)) {
            failure();
            return false;
        }

        /**
         * Find block coordinates given a position on a face.
         * Beware! One cannot add a floating block.
         */
        const dx = Math.abs(x-floors[0]); const dy = Math.abs(y-floors[1]); const dz = Math.abs(z-floors[2]);

        if (dx === 0 && dy !== 0 && dz !== 0) {
            // Which side of the face is empty...
            if (chunk.what(floors[0]-1, floors[1], floors[2]) === 0) floors[0] = floors[0]-1;
            else if (chunk.what(floors[0], floors[1], floors[2]) !== 0) {
                failure();
                return false;
            }
        } else if (dx !== 0 && dy === 0 && dz !== 0) {
            if (chunk.what(floors[0], floors[1]-1, floors[2]) === 0) floors[1] = floors[1]-1;
            else if (chunk.what(floors[0], floors[1], floors[2]) !== 0) {
                failure();
                return false;
            }
        } else if (dx !== 0 && dy !== 0 && dz === 0) {
            if (chunk.what(floors[0], floors[1], floors[2]-1) === 0) floors[2] = floors[2]-1;
            else if (chunk.what(floors[0], floors[1], floors[2]) !== 0) {
                failure();
                return false;
            }
        } else {
            failure();
            return false;
        }

        // Validate update.
        if (this._entityman.anEntityIsPresentOn(floors[0], floors[1], floors[2])) {
            failure();
            return false;
        }

        return true;
    }

    translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk) {
        function failure() { console.log("Request denied."); }

        if (!WorldManager.validateBlockEdition(originEntity, x, y, z, floors)) {
            failure();
            return false;
        }

        // Find which block to update.
        const dx = Math.abs(x-floors[0]); const dy = Math.abs(y-floors[1]); const dz = Math.abs(z-floors[2]);

        if (dx === 0 && dy !== 0 && dz !== 0) {
            if (chunk.what(floors[0]-1, floors[1], floors[2]) !== 0) floors[0] = floors[0]-1;
            else if (chunk.what(floors[0], floors[1], floors[2]) === 0) {
                failure();
                return false;
            }
        } else if (dx !== 0 && dy === 0 && dz !== 0) {
            if (chunk.what(floors[0], floors[1]-1, floors[2]) !== 0) floors[1] = floors[1]-1;
            else if (chunk.what(floors[0], floors[1], floors[2]) === 0) {
                failure();
                return false;
            }
        } else if (dx !== 0 && dy !== 0 && dz === 0) {
            if (chunk.what(floors[0], floors[1], floors[2]-1) !== 0) floors[2] = floors[2]-1;
            else if (chunk.what(floors[0], floors[1], floors[2]) === 0) {
                failure();
                return false;
            }
        } else {
            failure();
            return false;
        }

        // Validate update.
        if (this._entityman.anEntityIsPresentOn(floors[0], floors[1], floors[2])) {
            failure();
            return false;
        }

        return true;
    }

    addBlock(originEntity, x, y, z, blockId) {
        console.log(x + ' ' + y + ' ' + z + ' ' + blockId);
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = this.getChunkCoordinates(floors[0], floors[1], floors[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];
        const chunkId = i+','+j;
        var chunk = this._chunks[chunkId];
        if (!chunk || chunk === undefined) { console.log('Could not find chunk ' + chunkId); return; }

        // Validate request.
        if (!this.translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk)) return;

        // Add block on chunk.
        const chunkX = floors[0] - i * this.chunkDimensionX;
        const chunkY = floors[1] - j * this.chunkDimensionY;
        const chunkZ = floors[2] - k * this.chunkDimensionZ;
        console.log('ADDING BLOCK ' + chunkX + " " + chunkY + " " + chunkZ);
        chunk.add(chunkX, chunkY, chunkZ, blockId);

        // Remember this chunk was touched.
        this.chunkUpdated(chunkId);
    }

    delBlock(originEntity, x, y, z) {
        console.log(x + ' ' + y + ' ' + z);
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = this.getChunkCoordinates(floors[0], floors[1], floors[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];
        const chunkId = i+','+j;
        var chunk = this._chunks[chunkId];
        if (!chunk || chunk === undefined) { console.log('Could not find chunk ' + chunkId); return; }

        // Validate request.
        if (!this.translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk)) return;

        // Add block on chunk.
        const chunkX = floors[0] - i * this.chunkDimensionX;
        const chunkY = floors[1] - j * this.chunkDimensionY;
        const chunkZ = floors[2] - k * this.chunkDimensionZ;
        chunk.del(chunkX, chunkY, chunkZ);

        // Remember this chunk was touched.
        this.chunkUpdated(chunkId);
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
