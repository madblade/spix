/**
 *
 */

'use strict';

class UserInput {

    constructor(game) {
        this._game = game;
        this._incoming = [];
    }

    update() {
        // Process incoming actions
        // TODO manage spam spam spam spam spaaam, lovely spaaam, wonderful spam.
        this._incoming.forEach(function(e) {
            if (e.action !== 'move' ||
                !e.avatar || e.avatar === 'undefined' ||
                typeof e.meta !== "string")
                return;

            var hasMoved = true;
            switch (e.meta) {
                case 'f' : e.avatar.move(0, 1, 0);
                    break;
                case 'r' : e.avatar.move(1, 0, 0);
                    break;
                case 'l' : e.avatar.move(-1, 0, 0);
                    break;
                case 'b' : e.avatar.move(0, -1, 0);
                    break;
                default:
                    hasMoved = false;
            }

            // Notify an entity was updated.
            if (hasMoved) {
                this._game.objectman.entityUpdated(e.avatar.id);
            }
        }.bind(this));

        // Flush incoming actions.
        this._incoming = [];
    }

    push(kind, avatar) {
        return ((data) => {
            this._incoming.push({action:kind, avatar:avatar, meta:data});
        });
    }

    listenPlayer(player) {
        player.on('move', this.push('move', player.avatar));
    }

    removePlayer(player) {
        // Do not modify queue.
        // Drop inconsistent players when an update is performed.
        player.off('move', this.push('move', player.avatar));
        // TODO make a map with push function? I think it is different every time.
    }

}

export default UserInput;
