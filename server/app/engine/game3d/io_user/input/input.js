/**
 *
 */

'use strict';

class UserInput
{
    constructor(game)
    {
        this._game = game;

        this._physicsEngine     = game.physicsEngine;
        this._topologyEngine    = game.topologyEngine;
        this._consistencyEngine = game.consistencyEngine;
        this._chat              = game.chat;

        this._listeners = {}; // TODO [PERF] Map.
        this._playerUpdateBuffer = [];
    }

    // Update change in player connection / disconnection.
    update()
    {
        let consistencyEngine = this._consistencyEngine;
        let addedOrRemovedPlayers = this._playerUpdateBuffer;
        // WARN: short-circuits physics engine update.
        addedOrRemovedPlayers.forEach(update => {
            let type = update[0];
            let player = update[1];

            // Spawn and then listen.
            if (type === 'connect') {
                consistencyEngine.spawnPlayer(player);
                this.listenPlayer(player);
            }

            // Despawn.
            else if (type === 'disconnect') {
                // Dispensable to unlisten: a disconnected player has purged its playerConnection.
                // this.unlistenPlayer(player);
                consistencyEngine.despawnPlayer(player); // player = playerId
            }
        });

        // Flush.
        this._playerUpdateBuffer = [];
    }

    addPlayer(player)
    {
        this._playerUpdateBuffer.push(['connect', player]);
    }

    removePlayer(playerId)
    {
        this._playerUpdateBuffer.push(['disconnect', playerId]);
    }

    pushToEngine(kind, avatar, engine)
    {
        return data => {
            // [SECURITY] Think about banning users who send too much meta
            engine.addInput({action: kind, meta: data}, avatar);
        };
    }

    listenPlayer(player)
    {
        let physicsEngine       = this._physicsEngine;
        let topologyEngine      = this._topologyEngine;
        let consistencyEngine   = this._consistencyEngine;
        let avatar = player.avatar;

        let listener = this._listeners[player] = [
            this.pushToEngine('move',   avatar, physicsEngine),
            this.pushToEngine('rotate', avatar, physicsEngine),
            this.pushToEngine('block',  avatar, topologyEngine),
            this.pushToEngine('gate',   avatar, consistencyEngine),
            this.pushToEngine('action', avatar, physicsEngine),
            this.pushToEngine('use',    avatar, physicsEngine),

            this._chat.playerInput(player)
        ];

        let i = 0;
        player.on('m', listener[i++]);
        player.on('r', listener[i++]);
        player.on('b', listener[i++]);
        player.on('x', listener[i++]);
        player.on('a', listener[i++]);
        player.on('u', listener[i++]);
        player.on('chat', listener[i]);

        player.on('leave', () => { player.leave(); });
    }

    unlistenPlayer(player)
    {
        // Do not modify queue.
        // Drop inconsistent players when an update is performed.
        let listener = this._listeners[player];
        if (!listener) {
            console.log('WARN: a player which was not listened to left.');
            return;
        }

        let i = 0;
        player.off('m', listener[i++]);
        player.off('r', listener[i++]);
        player.off('b', listener[i++]);
        player.off('x', listener[i++]);
        player.off('a', listener[i++]);
        player.off('chat', listener[i]);

        player.off('leave', () => { player.leave(); });

        delete this._listeners[player];
    }
}

export default UserInput;
