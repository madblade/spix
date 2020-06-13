/**
 *
 */

'use strict';

// import TimeUtils from '../../../math/time';

class UserOutput
{
    static debug = false;

    constructor(game)
    {
        this._game = game;

        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;
        this._consistencyEngine = game.consistencyEngine;
    }

    static pack(message)
    {
        return JSON.stringify(message);
    }

    static bench = false;

    // XXX [PERF] -> don't recurse over every player, but rather over updates
    update(updateEntities)
    {
        // let t1;
        // let t2;

        // t1 = TimeUtils.getTimeSecNano();
        this.updateChunks();
        // t2 = TimeUtils.getTimeSecNano(t1)[1] / 1000;
        // if (UserOutput.bench && t2 > 1000) console.log(`${t2} µs to send chunk updates.`);

        // t1 = TimeUtils.getTimeSecNano();
        if (updateEntities)
            this.updateEntities();
        // t2 = TimeUtils.getTimeSecNano(t1)[1] / 1000;
        // if (UserOutput.bench && t2 > 1000) console.log(`${t2} µs to send entity updates.`);

        // t1 = TimeUtils.getTimeSecNano();
        this.updateX();
        // t2 = TimeUtils.getTimeSecNano(t1)[1] / 1000;
        // if (UserOutput.bench && t2 > 1000) console.log(`${t2} µs to send x updates.`);

        // t1 = TimeUtils.getTimeSecNano();
        this.updateMeta();
        // t2 = TimeUtils.getTimeSecNano(t1)[1] / 1000;
        // if (UserOutput.bench && t2 > 1000) console.log(`${t2} µs to send other stuff.`);

        this._consistencyEngine.flushBuffers(updateEntities);
    }

    updateChunks()
    {
        let game              = this._game;
        let topologyEngine    = this._topologyEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedChunks = topologyEngine.getOutput();
        let consistencyOutput = consistencyEngine.getChunkOutput();

        game.players.forEach(p => { if (p.avatar) {
            let hasNew;
            let hasUpdated;
            let pid = p.avatar.entityId;

            // XXX [PERF] check 'player has updated position'
            // player id -> changes (world id -> chunk id -> changes)
            let addedOrRemovedChunks = consistencyOutput.get(pid);
            hasNew = addedOrRemovedChunks && Object.keys(addedOrRemovedChunks).length > 0;

            let updatedChunksForPlayer = topologyEngine.getOutputForPlayer(p, updatedChunks, addedOrRemovedChunks);
            hasUpdated = updatedChunksForPlayer && Object.keys(updatedChunksForPlayer).length > 0;

            // New chunk + update => bundle updates with new chunks in one call.
            if (hasNew && hasUpdated) {
                for (let wiA in addedOrRemovedChunks) {
                    if (!addedOrRemovedChunks.hasOwnProperty(wiA)) continue;
                    if (wiA in updatedChunksForPlayer) {
                        Object.assign(addedOrRemovedChunks[wiA], updatedChunksForPlayer[wiA]);
                        delete updatedChunksForPlayer[wiA];
                    }
                }
                Object.assign(addedOrRemovedChunks, updatedChunksForPlayer);
            }

            if (hasNew) {
                // Format:
                // {
                //  'worldsMeta': {worldId:[type, r, cx,cy,cz]} . World metadata
                //  'worlds': {worldId:[x,y,z]} ................. World chunk dimensions
                //  worldId:
                //      {chunkId: [fastCC, fastCCId]} ........... Added chunk
                //      {chunkId: [removed, added, updated]} .... Updated chunk
                //      {chunkId: null} ......................... Removed chunk
                // }

                let output = UserOutput.pack(addedOrRemovedChunks);
                p.send('chk', output);
                // XXX [PERF] check if data === []
                // for (let wiA in addedOrRemovedChunks) console.log(Object.keys(addedOrRemovedChunks[wiA]));
            }
            else if (hasUpdated) {
                // (Format: ditto)
                // If only an update occurred on an existing, loaded chunk.
                let output = UserOutput.pack(updatedChunksForPlayer);
                p.send('chk', output);
            }
        }});

        // Empty chunk updates buffer.
        topologyEngine.flushOutput();
    }

    updateEntities()
    {
        let game              = this._game;
        let physicsEngine     = this._physicsEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedEntities = physicsEngine.getOutput();
        let consistencyOutput = consistencyEngine.getEntityOutput();

        if (updatedEntities.size < 1 && consistencyOutput.size < 1) return;

        // Broadcast updates.
        // XXX [PERF] bundle update in one chunk.
        // XXX [ENTITIES] ensure sync for player disconnections.
        game.players.forEach(p => {
            let pid = p.avatar.entityId;

            // If an entity in range of player p has just updated.
            let addedOrRemovedEntities = consistencyOutput.get(pid);

            // Consistency output SIMULATES UPDATED ENTITIES AS NEW ENTITIES.
            // Rapidly checked client-side, it prevents from using YET ANOTHER CALL to physicsEngine
            // and to compute distances between entities.
            //let updatedEntities = physicsEngine.getOutputForPlayer(p, updatedEntities);

            // XXX [PERF] detect change in position since the last time.
            // if (!entities), do it nevertheless, for it gives the player its own position.
            // Format:
            // [myPosition, myRotation, {
            //  entityId:
            //      null .................. removed entity
            //      {p: [], r:[], k:''} ... added or updated entity
            // }]
            // XXX [PERF] bundle, detect change.
            if (addedOrRemovedEntities && Object.keys(addedOrRemovedEntities).length > 0)
                p.send('ent', UserOutput.pack(addedOrRemovedEntities));
            let av = p.avatar;
            if (!av) return;

            // Array of [1. position, 2. rotation, 3. worldId] for each world.
            // First one is the main world.
            let rot = av.rotation;
            let oldRot = av.oldRotation;
            let selfState = [[
                av.position, [rot[0], oldRot[0], rot[2], rot[3]], av.worldId,
                [ // additional states
                    !!av.hit + 0,
                    !!av._isHitting + 0,
                    !!av._loadingRanged + 0,
                    !!av._isParrying + 0
                ]
            ]];
            // let otherStates = av.otherWorlds;
            // otherStates.forEach((state, worldId) => selfState.push([state.position, state.rotation, worldId]));
            p.send('me', UserOutput.pack(selfState));

            if (av._isHitting) av._isHitting = false;
        });

        // Empty entity updates buffer.
        physicsEngine.flushOutput();
    }

    updateX()
    {
        let game = this._game;
        let consistencyEngine = this._consistencyEngine;
        let xOutput = consistencyEngine.getXOutput();

        game.players.forEach(p => {
            let pav = p.avatar;
            if (!pav) return;

            let pid = pav.entityId;
            let addedOrRemovedX = xOutput.get(pid);

            if (addedOrRemovedX && Object.keys(addedOrRemovedX).length > 0)
            {
                let output = UserOutput.pack(addedOrRemovedX);

                // Format:
                // {portalId:
                //  null ....................................... removed portal
                //  [otherId, chunkId, worldId, ...state] ...... new or updated portal
                // }
                p.send('x', output);
            }
        });

        // TODO [PORTAL] Implement x updates.
        // xEngine.flushOutput();
    }

    updateMeta()
    {
        let game = this._game;
        game.chat.updateOutput();
    }
}

export default UserOutput;
