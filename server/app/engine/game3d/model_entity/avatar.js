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
        this._entityRenderDistance = 3 * 32;
        // TODO [PERF] Should be a number of closest entities instead

        // For op / admin accesses
        this._role = 0;

        this._nearestChunkId = null;

        this._pAction = [0, 0, 0]; // where action is triggered from
        this._fAction = [0, 0, 0]; // where action is looking to
        this._isParrying = false;
        this._loadingRanged = false;
        this._hasJustFired = false;
        this._hasJustMeleed = false;
        this._isHitting = false;
        this._hasJustJumped = false;
        this._isAvatar = true;
        this._timeSpentLoading = 0;
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

    get isParrying()                         { return this._isParrying; }
    getForwardActionVector()                 { return this._fAction; }
    unParry()                                { this._isParrying = false; }
    loadRanged()                             {
        this._loadingRanged = true;
        this._timeSpentLoading = 0;
    }
    unLoadRanged()
    {
        const power = this._timeSpentLoading;
        this._loadingRanged = false;
        this._timeSpentLoading = 0;
        return power;
    }
    parry(
        px, py, pz,
        fx, fy, fz
    )
    {
        this.setPF(px, py, pz, fx, fy, fz);
        this._isParrying = true;
    }
    melee(
        px, py, pz,
        fx, fy, fz
    )
    {
        this.setPF(px, py, pz, fx, fy, fz);
        this._hasJustMeleed = true;
    }
    countSinceLoadStart()
    {
        if (this._loadingRanged)
        {
            ++this._timeSpentLoading;
        } else {
            this._timeSpentLoading = 0;
        }
    }

    fire(
        px, py, pz,
        fx, fy, fz
    )
    {
        this.setPF(px, py, pz, fx, fy, fz);
        this._hasJustFired = true;
    }

    setPF(px, py, pz, fx, fy, fz)
    {
        let p = this._pAction;
        p[0] = px; p[1] = py; p[2] = pz;
        let f = this._fAction;
        const norm = fx * fx + fy * fy + fz * fz;
        let x = fx / norm; x = Math.min(Math.max(-1, x), 1);
        let y = fy / norm; y = Math.min(Math.max(-1, y), 1);
        let z = fz / norm; z = Math.min(Math.max(-1, z), 1);
        if (x * x + y * y + z * z > 1.001) return;
        f[0] = x;
        f[1] = y;
        f[2] = z;
    }
}

export default Avatar;
