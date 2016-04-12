/**
 *
 */

'use strict';

import Game from '../model/game';

class Flat3 extends Game {

    constructor(gameId) {
        super(gameId);

        this._terrain = [];
    }

    update() {
        console.log("Flat3 te dit coucou");
        this._players.forEach((p) => {
            p.socket.emit('stamp', this._terrain);
        });
    }

}

export default Flat3;
