/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity {

    constructor(id, entityModel) {
        super(id);
        this._entityModel = entityModel;

        this._kind = 'player';
        this._renderDistance = 8;
        this._role = 0;

        this._loadedChunks   = new Set();
        this._loadedEntities = new Set();
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
    get entityModel() { return this._entityModel; }

    get areChunksLoaded() {
        let side = (1+this._renderDistance*2);
        return side*side <= this._loadedChunks.size;
    }

    set renderDistance(renderDistance) { this._renderDistance = renderDistance; }
    set role(role) { this._role = role; }

    //isChunkLoaded(id) {
    //    return this._loadedChunks.has(id);
    //}

    //setChunkAsLoaded(chunkId) {
    //    this._loadedChunks.add(chunkId);
    //}

    //setChunkOutOfRange(chunkId) {
    //    this._loadedChunks.delete(chunkId);
    //}

    //isEntityLoaded(id) {
    //    return this._loadedEntities.has(id);
    //}

    //setEntityAsLoaded(entityId) {
    //    this._loadedEntities.add(entityId);
    //}

    //setEntityOutOfRange(entityId) {
    //    this._loadedEntities.delete(entityId);
    //}

}

export default Avatar;
