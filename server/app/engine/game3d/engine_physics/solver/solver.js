/**
 *
 */

'use strict';

import Newton from './newton/engine';

class Solver {

    constructor(physicsEngine) {
        // Models.
        this._entityModel   = physicsEngine.entityModel;
        this._worldModel    = physicsEngine.worldModel;

        // Output.
        this._outputBuffer  = physicsEngine.outputBuffer;

        // Internals.
        this._stamp = process.hrtime();
    }

    get entityModel()   { return this._entityModel; }
    get worldModel()    { return this._worldModel; }
    get outputBuffer()  { return this._outputBuffer; }

    solve() {
        let Δt = process.hrtime(this._stamp)[1];
        Newton.solve(this, Δt);
        this._stamp = process.hrtime();
    }

    shuffleGravity() {
        let g = Newton.gravity;
        Newton.gravity = [g[2], g[0], g[1]];
    }

}

export default Solver;
