/**
 *
 */

'use strict';

class UserOutput {

    constructor(game, playerman) {
        this._game = game;
        this._playerman = playerman;
    }

    update() {
        this._playerman.forEach((p) => {
            // TODO do something with each p.
            //p.send('stamp', this._game.extractWorld(p));
        });

        // TODO encapsulate within abstract game IO.
        this._game.broadcast('chat', 'YOUHOUUU');
    }

}

export default UserOutput;
