/**
 *
 */

'use strict';

class UserOutput {

    static debug = false;

    constructor(game) {
        this._game = game;

        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;
        this._consistencyEngine = game.consistencyEngine;
    }

    static pack(message) {
        return JSON.stringify(message);
    }

    static bench = false;

    // TODO [HIGH] -> don't recurse over every player, rather over updates...
    update() {
        let t1, t2;

        t1 = process.hrtime();
        //this.spawnPlayers();
        t2 = (process.hrtime(t1)[1]/1000);
        if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to spawn players.");

        t1 = process.hrtime();
        this.updateChunks();
        t2 = (process.hrtime(t1)[1]/1000);
        if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send chunk updates.");

        t1 = process.hrtime();
        this.updateEntities();
        t2 = (process.hrtime(t1)[1]/1000);
        if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send entity updates.");

        t1 = process.hrtime();
        this.updateX();
        t2 = (process.hrtime(t1)[1]/1000);
        if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send x updates.");

        t1 = process.hrtime();
        this.updateMeta();
        t2 = (process.hrtime(t1)[1]/1000);
        if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send other stuff.");

        this._consistencyEngine.flushBuffers();
    }

    // Every player spawns in initial world '-1'.
    spawnPlayers() {
        let consistencyEngine = this._consistencyEngine;
        let addedPlayers = consistencyEngine.getPlayerOutput();
        let game = this._game;
        let players = game.players;

        addedPlayers.forEach(pid => {
            let player = players.getPlayerFromId(pid);
            if (player) {
                let p = player, a = p.avatar;

                // Load chunks.
                // Format: {worldId: {chunkId: [fastComps, fastCompIds]}}
                let chunks = consistencyEngine.initChunkOutputForPlayer(p);
                p.send('chk', UserOutput.pack(chunks));

                // Load entities.
                // Format: {entityId: {p:pos, r:rot, k:kind}
                let entities = consistencyEngine.initEntityOutputForPlayer(p);
                p.send('ent', UserOutput.pack([a.position, a.rotation, entities]));

                if (UserOutput.debug) console.log('Init a new player on game ' + game.gameId + '.');
            }
        });
    }

    updateChunks() {
        let game              = this._game;
        let topologyEngine    = this._topologyEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedChunks = topologyEngine.getOutput();
        let consistencyOutput = consistencyEngine.getChunkOutput();

        game.players.forEach(p => { if (p.avatar) {
            let hasNew, hasUpdated;
            let pid = p.avatar.id;

            // TODO [LOW] check 'player has updated position'
            // TODO [MEDIUM] dynamically remove chunks with GreyZone, serverside
            // player id -> changes (world id -> chunk id -> changes)
            let addedOrRemovedChunks = consistencyOutput.get(pid);
            hasNew = (addedOrRemovedChunks && Object.keys(addedOrRemovedChunks).length > 0);

            let updatedChunksForPlayer = topologyEngine.getOutputForPlayer(p, updatedChunks, addedOrRemovedChunks);
            hasUpdated = (updatedChunksForPlayer && Object.keys(updatedChunksForPlayer).length > 0);

            if (hasNew) {
                // New chunk + update => bundle updates with new chunks in one call.
                if (hasUpdated) {
                    for (let wiA in addedOrRemovedChunks) {
                        if (wiA in updatedChunksForPlayer) {
                            Object.assign(addedOrRemovedChunks[wiA], updatedChunksForPlayer[wiA]);
                            delete updatedChunksForPlayer[wiA];
                        }
                    }

                    Object.assign(addedOrRemovedChunks, updatedChunksForPlayer);
                }

                // Format:
                // {
                //  'worlds': {worldId:[x,y,z]} ............... World metadata
                //  worldId:
                //      {chunkId: [fastCC, fastCCId]} ......... Added chunk
                //      {chunkId: [removed, added, updated]} .. Updated chunk
                //      {chunkId: null} ....................... Removed chunk
                // }

                let output = UserOutput.pack(addedOrRemovedChunks);
                p.send('chk', output);
                // TODO [CRIT] check appearance of []
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

    updateEntities() {
        let game              = this._game;
        let physicsEngine     = this._physicsEngine;
        let consistencyEngine = this._consistencyEngine;

        let updatedEntities = physicsEngine.getOutput();
        let consistencyOutput = consistencyEngine.getEntityOutput();

        if (updatedEntities.size < 1) return;

        // Broadcast updates.
        // TODO [HIGH] bundle update in one chunk.
        game.players.forEach(p => {
            let pid = p.avatar.id;

            // If an entity in range of player p has just updated.
            let addedOrRemovedEntities = consistencyOutput.get(pid);

            // Consistency output SIMULATES UPDATED ENTITIES AS NEW ENTITIES.
            // Rapidly checked client-side, it prevents from using YET ANOTHER CALL to physicsEngine
            // and to compute distances between entities.
            //let updatedEntities = physicsEngine.getOutputForPlayer(p, updatedEntities);

            // TODO [LOW] detect change in position since the last time.
            // if (!entities), do it nevertheless, for it gives the player its own position.
            // Format:
            // [myPosition, myRotation, {
            //  entityId:
            //      null .................. removed entity
            //      {p: [], r:[], k:''} ... added or updated entity
            // }]
            // TODO [HIGH] bundle, detect change.
            p.send('ent', UserOutput.pack(addedOrRemovedEntities));
            let av = p.avatar;
            // Array of [1. position, 2. rotation, 3. worldId] for each world.
            // First one is the main world.
            let selfState = [[av.position, av.rotation, av.worldId]];
            let otherStates = av.otherStates;
            otherStates.forEach((state, worldId) => selfState.push([state.position, state.rotation, worldId]));
            p.send('me', UserOutput.pack(selfState));
        });

        // Empty entity updates buffer.
        physicsEngine.flushOutput();
    }

    updateX() {
        let game = this._game;
        let consistencyEngine = this._consistencyEngine;
        let xOutput = consistencyEngine.getXOutput();

        game.players.forEach(p => {
            let pid = p.avatar.id;
            let addedOrRemovedX = xOutput.get(pid);

            if (addedOrRemovedX && Object.keys(addedOrRemovedX).length > 0) {
                let output = UserOutput.pack(addedOrRemovedX);

                // Format:
                // {portalId:
                //  null ....................................... removed portal
                //  [otherId, chunkId, worldId, ...state] ...... new or updated portal
                // }
                p.send('x', output);
            }
        });

        // TODO [MEDIUM] when x updates are implemented.
        // xEngine.flushOutput();
    }

    updateMeta() {
        let game = this._game;
        game.chat.updateOutput();
    }

}

export default UserOutput;
