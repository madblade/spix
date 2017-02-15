/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity {

    constructor(id, entityModel) {
        super(id);
        //this._entityModel = entityModel;

        this._kind = 'player';

        // Counted as a number of chunks.
        this._chunkRenderDistance = 5;
        this._chunkUnloadDistance = 5;
        this._portalRenderDistance = 3;

        // Counted as a number of blocks.
        this._entityRenderDistance = 2*8;

        this._role = 0;

        this._nearestChunkId = null;
    }

    // Returns -1: admin, 0: OP, 1: registered, 2: guest.
    get role()                                  { return this._role; }
    get chunkRenderDistance()                   { return this._chunkRenderDistance; }
    get chunkUnloadDistance()                   { return this._chunkUnloadDistance; }
    get entityRenderDistance()                  { return this._entityRenderDistance; }
    get portalRenderDistance()                  { return this._portalRenderDistance; }
    get nearestChunkId()                        { return this._nearestChunkId; }
    //get entityModel()                           { return this._entityModel; }

    set role(role)                              { this._role = role; }
    set chunkRenderDistance(renderDistance)     { this._chunkRenderDistance = renderDistance; }
    set chunkUnloadDistance(unloadDistance)     { this._chunkUnloadDistance = unloadDistance; }
    set entityRenderDistance(renderDistance)    { this._entityRenderDistance = renderDistance; }
    set portalRenderDistance(renderDistance)    { this._portalRenderDistance = renderDistance; }
    set nearestChunkId(chunkId)                 { this._nearestChunkId = chunkId; }
}

export default Avatar;
