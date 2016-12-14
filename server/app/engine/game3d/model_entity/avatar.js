/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity {

    constructor(id, entityManager) {
        super(id);
        this._kind = 'player';

        this._entityManager = entityManager;
        this._loadedChunks = new Map();
        this._renderDistance = 8;
        this._role = 0;
    }

    /**
     * @returns
     *  -1: admin
     *  0: OP
     *  1: registered
     *  2: guest
     */
    get role() { return this._role; }
    get renderDistance() { return this._renderDistance; }
    get loadedChunks() { return this._loadedChunks; }
    get entityManager() { return this._entityManager; }

    get areChunksLoaded() {
        let side = (1+this._renderDistance*2);
        return side*side <= this._loadedChunks.size;
    }

    set renderDistance(renderDistance) { this._renderDistance = renderDistance; }
    set role(role) { this._role = role; }

    isChunkLoaded(id) {
        return this._loadedChunks.has(id);
    }

    setChunkAsLoaded(chunk) {
        this._loadedChunks.set(chunk.chunkId, chunk);
    }

    setChunkOutOfRange(chunk) {
        this._loadedChunks.delete(chunk.chunkId);
    }

}

export default Avatar;
