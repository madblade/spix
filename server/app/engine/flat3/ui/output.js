/**
 *
 */

'use strict';

class UserOutput {

    constructor(game, playerman) {
        this._game = game;
        this._playerman = playerman;
    }

    update(world) {
        this._playerman.forEach((p) => {
            // TODO do something with each p.
            p.send('stamp', UserOutput.extractWorld(p, world));
        });

        // TODO encapsulate within abstract game IO.
        //this._game.broadcast('chat', 'YOUHOUUU');
    }

    // TODO subsample world
    static extractWorld(player, world) {
        return world;
    }

}

export default UserOutput;
