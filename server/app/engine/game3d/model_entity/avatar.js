/**
 *
 */

'use strict';

import Entity from './entity';

class Avatar extends Entity
{
    constructor(id)
    {
        super(id);

        this._kind = 'player';

        // Counted as a number of chunks.
        this._chunkRenderDistance = 5;
        // If you increase this, also increase model_x/model.push(chksZ, currentDepth + 2);
        // For flat worlds
        this._chunkUnloadDistance = 10;
        // Might be a good idea to keep the unload distance as big as possible client-wise
        // When games don’t contain many players.

        this._portalRenderDistance = 3;

        // Counted as a number of blocks.
        this._entityRenderDistance = 2 * 8;

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

    set role(role)                              { this._role = role; }
    set chunkRenderDistance(renderDistance)     { this._chunkRenderDistance = renderDistance; }
    set chunkUnloadDistance(unloadDistance)     { this._chunkUnloadDistance = unloadDistance; }
    set entityRenderDistance(renderDistance)    { this._entityRenderDistance = renderDistance; }
    set portalRenderDistance(renderDistance)    { this._portalRenderDistance = renderDistance; }
    set nearestChunkId(chunkId)                 { this._nearestChunkId = chunkId; }
}

export default Avatar;
