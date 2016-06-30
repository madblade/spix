/**
 *
 */

'use strict';

class UserInput {

    constructor(game) {
        this._game = game;
        this._incoming = new Map();
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
            });
        });

        // Flush incoming actions.
        this._incoming = new Map();
    }

    // TODO moveLeft & such methods.
    move(meta, avatar) {
        var hasMoved = true;
        switch (meta) {
            case 'f' : avatar.goForward();      break;
            case 'r' : avatar.goRight();        break;
            case 'l' : avatar.goLeft();         break;
            case 'b' : avatar.goBackwards();    break;

            case 'fx' : avatar.stopForward();   break;
            case 'rx' : avatar.stopRight();     break;
            case 'lx' : avatar.stopLeft();      break;
            case 'bx' : avatar.stopBackwards(); break;
            case 'xx' : avatar.stop();          break;

            default: hasMoved = false;
        }
    };

    rotate(meta, avatar) {
        if (!(meta instanceof Array)) return;
        var p = meta[0], y = meta[1];
        if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
            avatar.rotate(p, y);
            this._game.entityman.entityUpdated(avatar.id);
        }
    }

    block(meta, avatar) {
        if (!(meta instanceof Array)) return;
        var action = meta[0];
        var x = meta[1];
        var y = meta[2];
        var z = meta[3];
        // TODO check distance and add.
        console.log(x + ' ' + y + ' ' + z);
    }

    push(kind, avatar) {
        return ((data) => {
            var array = this._incoming.get(avatar);
            if (!array || array === 'undefined') {
                this._incoming.set(avatar, [{action:kind, meta:data}]);
            } else {
                this._incoming.get(avatar).push({action:kind, meta:data});
            }
        });
    }

    listenPlayer(player) {
        player.on('m', this.push('move', player.avatar));
        player.on('r', this.push('rotate', player.avatar));
        player.on('b', this.push('block', player.avatar));
    }

    removePlayer(player) {
        // Do not modify queue.
        // Drop inconsistent players when an update is performed.
        player.off('m', this.push('move', player.avatar));
        player.off('r', this.push('rotate', player.avatar));
        player.off('b', this.push('block', player.avatar));
        // TODO make a map with push function? I think it is different every time.
    }

}

export default UserInput;
