/**
 *
 */

'use strict';

import Newton from './newton/engine';

class Physics {

    constructor(entityman, worldman) {
        this._entityman = entityman;
        this._worldman = worldman;

        /* internal */
        this._stamp = process.hrtime();
    }

    update() {
        let Δt = process.hrtime(this._stamp)[1];

        Newton.solve(this._entityman, this._worldman, Δt);

        this._stamp = process.hrtime();
    }

    shuffleGravity() {
        console.log('shuffle grav');
        let g = Newton.gravity;
        Newton.gravity = [g[2], g[0], g[1]];
    }

}

export default Physics;
