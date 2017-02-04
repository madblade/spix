/**
 *
 */

'use strict';

import RigidBodies from './rigid_bodies/engine';

class FrontEnd {

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
        RigidBodies.solve(this, Δt);
        this._stamp = process.hrtime();
    }

    shuffleGravity() {
        let g = RigidBodies.gravity;
        RigidBodies.gravity = [g[2], g[0], g[1]];
    }

}

export default FrontEnd;
