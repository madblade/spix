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
        // TODO manage spam spam spam spam spaaam, lovely spaaam, wonderful spam.
        this._incoming.forEach((array, avatar) => {
            array.forEach(e => {
                if (e.action !== 'move' ||
                    !avatar || avatar === 'undefined' ||
                    typeof e.meta !== "string")
                    return;

                var hasMoved = true;
                switch (e.meta) {
                    case 'f' : avatar.move(0, 1, 0);
                        break;
                    case 'r' : avatar.move(1, 0, 0);
                        break;
                    case 'l' : avatar.move(-1, 0, 0);
                        break;
                    case 'b' : avatar.move(0, -1, 0);
                        break;
                    default:
                        hasMoved = false;
                }

                // Notify an entity was updated.
                if (hasMoved) {
                    this._game.objectman.entityUpdated(avatar.id);
                }
            });
        });

        // Flush incoming actions.
        this._incoming = new Map();
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
