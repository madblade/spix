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
        let t1 = this._stamp;
        let Δt = process.hrtime(t1)[1];

        Newton.solve(this._entityman, this._worldman, Δt);

        this._stamp = process.hrtime();
    }

}

export default Physics;
