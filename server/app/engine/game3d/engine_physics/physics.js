/**
 *
 */

'use strict';

import Newton from './newton/engine';

class PhysicsEngine {

    constructor(game) {
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        this._xModel        = game.xModel;

        /* internal */
        this._stamp = process.hrtime();
    }

    update() {
        let Δt = process.hrtime(this._stamp)[1];

        Newton.solve(this._entityModel, this._worldModel, Δt);

        this._stamp = process.hrtime();
    }

    shuffleGravity() {
        let g = Newton.gravity;
        Newton.gravity = [g[2], g[0], g[1]];
    }

}

export default PhysicsEngine;
