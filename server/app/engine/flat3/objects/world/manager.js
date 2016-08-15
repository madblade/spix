/**
 *
 */

'use strict';

import Generator from './generator';
import Factory from '../world/factory';

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

    static distance3(v1, v2) {
        let x = v1[0]-v2[0]; x*=x;
        let y = v1[1]-v2[1]; y*=y;
        let z = v1[2]-v2[2]; z*=z;
        return Math.sqrt(x+y+z);
    }

    static validateBlockEdition(originEntity, x, y, z, floors) {
        let fx = floors[0]; let fy = floors[1]; let fz = floors[2];
        // 4 blocks maximum range for block editing.
        const d3 = WorldManager.distance3(originEntity.position, [fx+.5, fy+.5, fz+.5]);
        return (d3 < 10);
    }

    translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk) {
        function failure(step) { console.log("Request denied at step " + step); }

        if (!WorldManager.validateBlockEdition(originEntity, x, y, z, floors)) { failure(0); return false; }

        // One cannot add a floating block.
        const dx = Math.abs(Math.abs(x) - Math.abs(floors[0]));
        const dy = Math.abs(Math.abs(y) - Math.abs(floors[1]));
        const dz = Math.abs(Math.abs(z) - Math.abs(floors[2]));

        const lx = blockCoordinatesOnChunk[0]; // l stands for local
        const ly = blockCoordinatesOnChunk[1];
        const lz = blockCoordinatesOnChunk[2];

        if (dx === 0 && dy !== 0 && dz !== 0) {
            // Which side of the face is empty...
            if (chunk.what(lx-1, ly, lz) === 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;

        } else if (dx !== 0 && dy === 0 && dz !== 0) {
            if (chunk.what(lx, ly-1, lz) === 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;

        } else if (dx !== 0 && dy !== 0 && dz === 0) {
            if (chunk.what(lx, ly, lz-1) === 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;

        // On-edge request.
        } else { failure(1); return false; }

        // Designed block must be 0.
        // console.log(blockCoordinatesOnChunk);
        if (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) !== 0) {
            failure(2);
            return false;
        }

        // Detect OOB.
        if (blockCoordinatesOnChunk[0] < 0 || blockCoordinatesOnChunk[0] >= this.chunkDimensionX ||
            blockCoordinatesOnChunk[1] < 0 || blockCoordinatesOnChunk[1] >= this.chunkDimensionY ||
            blockCoordinatesOnChunk[2] < 0 || blockCoordinatesOnChunk[2] >= this.chunkDimensionZ) {
            failure(3);
            return false;
        }

        // Detect entities.
        if (this._entityman.anEntityIsPresentOn(floors[0], floors[1], floors[2])) {
            failure(4);
            return false;
        }

        return true;
    }

    translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk) {
        function failure(step) { console.log("Request denied at step " + step); }

        if (!WorldManager.validateBlockEdition(originEntity, x, y, z, floors)) { failure(0); return false; }

        const dx = Math.abs(Math.abs(x) - Math.abs(floors[0]));
        const dy = Math.abs(Math.abs(y) - Math.abs(floors[1]));
        const dz = Math.abs(Math.abs(z) - Math.abs(floors[2]));

        const lx = blockCoordinatesOnChunk[0]; // l stands for local
        const ly = blockCoordinatesOnChunk[1];
        const lz = blockCoordinatesOnChunk[2];

        if (dx === 0 && dy !== 0 && dz !== 0) {
            if (chunk.what(lx-1, ly, lz) !== 0) blockCoordinatesOnChunk[0] = blockCoordinatesOnChunk[0]-1;

        } else if (dx !== 0 && dy === 0 && dz !== 0) {
            if (chunk.what(lx, ly-1, lz) !== 0) blockCoordinatesOnChunk[1] = blockCoordinatesOnChunk[1]-1;

        } else if (dx !== 0 && dy !== 0 && dz === 0) {
            if (chunk.what(lx, ly, lz-1) !== 0) blockCoordinatesOnChunk[2] = blockCoordinatesOnChunk[2]-1;

        // On-edge request.
        } else { failure(1); return false; }

        // Designed block must be 0.
        // console.log(blockCoordinatesOnChunk);
        if (chunk.what(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]) === 0) {
            failure(2);
            return false;
        }

        // Detect OOB.
        if (blockCoordinatesOnChunk[0] < 0 || blockCoordinatesOnChunk[0] >= this.chunkDimensionX ||
            blockCoordinatesOnChunk[1] < 0 || blockCoordinatesOnChunk[1] >= this.chunkDimensionY ||
            blockCoordinatesOnChunk[2] < 0 || blockCoordinatesOnChunk[2] >= this.chunkDimensionZ) {
            failure(3);
            return false;
        }

        // Validate update.
        if (this._entityman.anEntityIsPresentOn(floors[0], floors[1], floors[2])) {
            failure(4);
            return false;
        }

        return true;
    }

    addBlock(originEntity, x, y, z, blockId) {
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = this.getChunkCoordinates(floors[0], floors[1], floors[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];
        const chunkId = i+','+j;
        var chunk = this._chunks[chunkId];
        console.log("Transaction required on " + chunkId);
        if (!chunk || chunk === undefined) { console.log('Could not find chunk ' + chunkId); return; }

        // Validate request.
        let blockCoordinatesOnChunk = [
            floors[0] - i * this.chunkDimensionX,
            floors[1] - j * this.chunkDimensionY,
            floors[2] - k * this.chunkDimensionZ
        ];
        if (!this.translateAndValidateBlockAddition(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk))
            return;

        // Add block on chunk.
        // console.log(blockCoordinatesOnChunk);
        chunk.add(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2], blockId);

        // Remember this chunk was touched.
        this.chunkUpdated(chunkId);
    }

    delBlock(originEntity, x, y, z) {
        let floors = [Math.floor(x), Math.floor(y), Math.floor(z)];

        // Find chunk (i,j) & block coordinates within chunk.
        let coordinates = this.getChunkCoordinates(floors[0], floors[1], floors[2]);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];
        const chunkId = i+','+j;
        var chunk = this._chunks[chunkId];

        console.log("Transaction required on " + chunkId);
        if (!chunk || chunk === undefined) { console.log('Could not find chunk ' + chunkId); return; }

        // Validate request.
        let blockCoordinatesOnChunk = [
            floors[0] - i * this.chunkDimensionX,
            floors[1] - j * this.chunkDimensionY,
            floors[2] - k * this.chunkDimensionZ
        ];
        if (!this.translateAndValidateBlockDeletion(originEntity, x, y, z, floors, chunk, blockCoordinatesOnChunk))
            return;

        // Add block on chunk.
        // console.log(blockCoordinatesOnChunk);
        chunk.del(blockCoordinatesOnChunk[0], blockCoordinatesOnChunk[1], blockCoordinatesOnChunk[2]);

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
