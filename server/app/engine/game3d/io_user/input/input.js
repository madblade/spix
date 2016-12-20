/**
 *
 */

'use strict';

class UserInput {

    constructor(game) {
        this._game = game;
        
        this._physicsEngine  = game.physicsEngine;
        this._topologyEngine = game.topologyEngine;
        this._chat           = game.chat;

        this._listeners = {};
    }

    update() {}

    pushToEngine(kind, avatar, engine) {
        return (data => {
            engine.addInput({action: kind, meta: data}, avatar);
        });
    }

    listenPlayer(player) {
        let physicsEngine = this._physicsEngine;
        let topologyEngine = this._topologyEngine;
        let avatar = player.avatar;

        let listener = this._listeners[player] = [
            this.pushToEngine('move',   avatar, physicsEngine),
            this.pushToEngine('rotate', avatar, physicsEngine),
            this.pushToEngine('block',  avatar, topologyEngine),
            this.pushToEngine('action', avatar, physicsEngine),

            this._chat.playerInput(player)
        ];

        player.on('m', listener[0]);
        player.on('r', listener[1]);
        player.on('b', listener[2]);
        player.on('a', listener[3]);
        player.on('chat', listener[4]);
    }

    removePlayer(player) {
        // Do not modify queue.
        // Drop inconsistent players when an update is performed.
        let listener = this._listeners[player];
        if (!listener || listener === null) {
            console.log('WARN: a player which was not listened to left.');
            return;
        }

        player.off('m', listener[0]);
        player.off('r', listener[1]);
        player.off('b', listener[2]);
        player.off('a', listener[3]);
        player.off('chat', listener[4]);

        delete this._listeners[player];
    }

}

export default UserInput;
