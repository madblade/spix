/**
 * Player entry point.
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
        this._chunkRenderDistance = 4;
        // If you increase this, also increase model_x/model.push(chksZ, currentDepth + 2);
        // For flat worlds
        this._chunkUnloadDistance = 8;
        // Might be a good idea to keep the unload distance as big as possible client-wise
        // When games don’t contain many players.

        this._portalRenderDistance = 3;

        // Counted as a number of blocks.
        this._entityRenderDistance = 2 * 8;

        // For op / admin accesses
        this._role = 0;

        this._nearestChunkId = null;

        this._pAction = [0, 0, 0]; // where action is triggered from
        this._fAction = [0, 0, 0]; // where action is looking to
        this._isParrying = false;
        this._loadingRanged = false;
        this._hasJustFired = false;
        this._hasJustMeleed = false;
        this._hasJustJumped = false;
    }

    // Returns -1: admin, 0: OP, 1: registered, 2: guest.
    get role()                               { return this._role; }
    get chunkRenderDistance()                { return this._chunkRenderDistance; }
    get chunkUnloadDistance()                { return this._chunkUnloadDistance; }
    get entityRenderDistance()               { return this._entityRenderDistance; }
    get portalRenderDistance()               { return this._portalRenderDistance; }
    get nearestChunkId()                     { return this._nearestChunkId; }

    get hasJustMeleed()                      { return this._hasJustMeleed; }
    set hasJustMeleed(n)                     { this._hasJustMeleed = n; }
    get loadingRanged()                      { return this._loadingRanged; }
    set loadingRanged(n)                     { this._loadingRanged = n; }
    get hasJustFired()                       { return this._hasJustFired; }
    set hasJustFired(n)                      { this._hasJustFired = n; }

    set role(role)                           { this._role = role; }
    set chunkRenderDistance(renderDistance)  { this._chunkRenderDistance = renderDistance; }
    set chunkUnloadDistance(unloadDistance)  { this._chunkUnloadDistance = unloadDistance; }
    set entityRenderDistance(renderDistance) { this._entityRenderDistance = renderDistance; }
    set portalRenderDistance(renderDistance) { this._portalRenderDistance = renderDistance; }
    set nearestChunkId(chunkId)              { this._nearestChunkId = chunkId; }

    parry()                                  { this._isParrying = true; }
    unParry()                                { this._isParrying = false; }
    loadRanged()                             { this._loadingRanged = true; }
    unLoadRanged()                           { this._loadingRanged = false; }
    melee(
        px, py, pz,
        fx, fy, fz
    )
    {
        let p = this._pAction;
        p[0] = px; p[1] = py; p[2] = pz;
        let f = this._fAction;
        f[0] = fx; f[1] = fy; f[2] = fz;
        this._hasJustMeleed = true;
    }
    fire(
        px, py, pz,
        fx, fy, fz
    )
    {
        let p = this._pAction;
        p[0] = px; p[1] = py; p[2] = pz;
        let f = this._fAction;
        f[0] = fx; f[1] = fy; f[2] = fz;
        this._hasJustFired = true;
    }
}

export default Avatar;
