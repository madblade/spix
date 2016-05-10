/**
 *
 */

'use strict';

import ObjectFactory from './factory';
import CollectionUtil from '../../../math/collections/util';
import Generator from '../ai/generator';

class ObjectManager {

    constructor() {
        // Objects.
        this._chunks = {};
        this._entities = {};

        // Keep track of modified chunks.
        this._updatedChunks = {};
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

    generate() {
        return new Promise((resolve) => {
            this._chunks = Generator.generateFlatWorld();
            resolve();
        });
    }

    update() {
        // TODO update entities.
    }

    updateTransmitted() {
        this._updatedChunks = {};
    }

    spawnPlayer(p) {
        let id = CollectionUtil.generateId(this._entities);
        p.avatar = ObjectFactory.createAvatar(id);
        p.avatar.spawn();
        this._entities[id] = p.avatar;
    }

    despawnPlayer(p) {
        p.avatar.die();
        delete this._entities[p.avatar.id];
        delete p.avatar;
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
        this._updatedChunks[chunkId] = true;
    }

    delBlock(x, y, z) {

    }

    whatBlock(x, y, z) {

    }

}

export default ObjectManager;
