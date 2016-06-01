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
            case 'f' : avatar.move(0, 1, 0);
                break;
            case 'r' : avatar.move(1, 0, 0);
                break;
            case 'l' : avatar.move(-1, 0, 0);
                break;
            case 'b' : avatar.move(0, -1, 0);
                break;
            default: hasMoved = false;
        }

        // Notify an entity was updated.
        if (hasMoved) this._game.objectman.entityUpdated(avatar.id);
    };

    rotate(meta, avatar) {
        var parsed = JSON.parse(meta);

        var p = parsed[0], y = parsed[1];
        if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
            avatar.rotate(parsed[0], parsed[1]);
            this._game.objectman.entityUpdated(avatar.id);
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
