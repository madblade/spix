/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity {

    constructor(id, entityManager) {
        super(id);

        this._entityManager = entityManager;
        this._loadedChunks = {};
        this._renderDistance = 8;
    }

    get renderDistance() { return this._renderDistance; }
    get loadedChunks() { return this._loadedChunks; }
    get entityManager() { return this._entityManager; }

    set renderDistance(renderDistance) { this._renderDistance = renderDistance; }

    setChunkAsLoaded(chunk) {
        this._loadedChunks[chunk.chunkId] = chunk;
    }

    setChunkOutOfRange(chunk) {
        delete this._loadedChunks[chunk.chunkId];
    }

}

export default Avatar;
