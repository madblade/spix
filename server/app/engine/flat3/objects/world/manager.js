/**
 *
 */

'use strict';

import Generator from '../../ai/generator';
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

    get updatedChunks() {
        var updatedChuks = [];
        for (var id in this._updatedChunks) {
            if (!this._updatedChunks.hasOwnProperty(id)) continue;
            updatedChuks[id] = this._chunks[id].blocks;
        }
        return updatedChuks;
    }

    extractChunks(player) {
        var chunks = [];
        for (var eid in this._updatedChunks) {
            if (!this._updatedChunks.hasOwnProperty(eid) ||
                !this._chunks.hasOwnProperty(eid)) continue;

            chunks.push(this._chunks[eid]);
        }
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
