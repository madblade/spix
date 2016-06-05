/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity {

    constructor(id) {
        super(id);

        this._loadedChunks = {};
    }

    get loadedChunks() { return this._loadedChunks; }

    setChunkAsLoaded(chunk) {
        this._loadedChunks[chunk.chunkId] = chunk;
    }

    setChunkOutOfRange(chunk) {
        delete this._loadedChunks[chunk.chunkId];
    }

}

export default Avatar;
