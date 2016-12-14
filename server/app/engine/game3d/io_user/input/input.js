/**
 *
 */

'use strict';

class UserInput {

    constructor(game) {
        this._game = game;
        this._incoming = new Map();
        this._listeners = {};
    }

    update() {
        // Process incoming actions
        this._incoming.forEach((array, avatar) => {
            if (!avatar || avatar === 'undefined') return;

            // avatar: key; array: value
            array.forEach(e => {
                if (e.action === 'move' && typeof e.meta === "string")
                    // TODO compute means or filter some events.
                    this.move(e.meta, avatar);

                else if (e.action === 'rotate')
                    this.rotate(e.meta, avatar);

                else if (e.action === 'block')
                    this.block(e.meta, avatar);

                else if (e.action === 'action' && typeof e.meta === "string")
                    this.action(e.meta, avatar);
            });
        });

        // Flush incoming actions.
        this._incoming = new Map();
    }

    move(meta, avatar) {
        var hasMoved = true;
        switch (meta) {
            case 'f'  : avatar.goForward();     break;
            case 'r'  : avatar.goRight();       break;
            case 'l'  : avatar.goLeft();        break;
            case 'b'  : avatar.goBackwards();   break;
            case 'u'  : avatar.goUp();          break;
            case 'd'  : avatar.goDown();        break;

            case 'fx' : avatar.stopForward();   break;
            case 'rx' : avatar.stopRight();     break;
            case 'lx' : avatar.stopLeft();      break;
            case 'bx' : avatar.stopBackwards(); break;
            case 'ux' : avatar.stopUp();        break;
            case 'dx' : avatar.stopDown();      break;
            case 'xx' : avatar.stop();          break;

            default: hasMoved = false;
        }
    };

    rotate(meta, avatar) {
        if (!(meta instanceof Array)) return;
        // TODO manage border effects on entity destructions
        if (avatar.rotation === null) return;

        let p = meta[0], y = meta[1];

        // Manage player rotation
        if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
            avatar.rotate(p, y);
            this._game.entityModel.entityUpdated(avatar.id);
        }
    }

    block(meta, avatar) {
        if (!(meta instanceof Array)) return;
        let action = meta[0];

        // Manage block addition.
        if (action === "add") {
            this._game.worldModel.addBlock(avatar, meta[1], meta[2], meta[3], meta[4]);
        } else if (action === "del") {
            this._game.worldModel.delBlock(avatar, meta[1], meta[2], meta[3]);
        }
    }

    action(meta, avatar) {
        if (meta === "g") {
            this._game.physicsEngine.shuffleGravity();
        }
    }

    push(kind, avatar) {
        return (data => {
            var array = this._incoming.get(avatar);
            if (!array) {
                this._incoming.set(avatar, [{action:kind, meta:data}]);
            } else {
                this._incoming.get(avatar).push({action:kind, meta:data});
            }
        });
    }

    listenPlayer(player) {
        let listener = this._listeners[player] = [
            this.push('move', player.avatar),
            this.push('rotate', player.avatar),
            this.push('block', player.avatar),
            this.push('action', player.avatar),
            this._game.chat.playerInput(player)
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
