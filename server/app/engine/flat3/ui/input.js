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

                else if (e.action === 'rotate' && typeof e.meta === 'string')
                    this.rotate(e.meta, avatar);
            });
        });

        // Flush incoming actions.
        this._incoming = new Map();
    }

    // TODO moveLeft & such methods.
    move(meta, avatar) {
        var hasMoved = true;
        switch (meta) {
            case 'f' : avatar.goForward();
                break;
            case 'r' : avatar.goRight();
                break;
            case 'l' : avatar.goLeft();
                break;
            case 'b' : avatar.goBackwards();
                break;

            case 'fx' : avatar.stopForward();
                break;
            case 'rx' : avatar.stopRight();
                break;
            case 'lx' : avatar.stopLeft();
                break;
            case 'bx' : avatar.stopBackwards();
                break;
            case 'xx' : avatar.stop();
                break;
            default: hasMoved = false;
        }
    };

    rotate(meta, avatar) {
        var parsed = JSON.parse(meta);

        var p = parsed[0], y = parsed[1];
        if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
            avatar.rotate(parsed[0], parsed[1]);
            this._game.entityman.entityUpdated(avatar.id);
        }
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
        player.on('r', this.push('rotate', player.avatar))
    }

    removePlayer(player) {
        // Do not modify queue.
        // Drop inconsistent players when an update is performed.
        player.off('m', this.push('move', player.avatar));
        player.off('r', this.push('rotate', player.avatar));
        // TODO make a map with push function? I think it is different every time.
    }

}

export default UserInput;
