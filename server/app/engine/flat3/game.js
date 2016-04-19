/**
 *
 */

'use strict';

import Game from '../../model/game/game';

class Flat3 extends Game {

    constructor(gameId, connector) {
        super(gameId, connector);

        // TODO kind Enum
        this._kind = 'flat3';
        this._terrain = [];
    }

    update() {
        console.log("Flat3 sez hy " + this._players.length);
        //this._players.forEach((p) => {
        //    p.send('stamp', this._terrain);
        //});
    }

}

export default Flat3;
