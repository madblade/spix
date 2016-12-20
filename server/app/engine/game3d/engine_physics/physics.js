/**
 *
 */

'use strict';

import InputBuffer      from './input_buffer';
import OutputBuffer     from './output_buffer';

import Newton   from './newton/engine';
import Updater  from './updater/updater';

class PhysicsEngine {

    constructor(game) {
        // Models.
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        this._xModel        = game.xModel;

        // Buffers.
        this._inputBuffer   = new InputBuffer();
        this._outputBuffer  = new OutputBuffer();

        // Engine.
        this._updater       = new Updater(this);
        //this._solver        = new Solver(this);

        // Internals.
        this._stamp = process.hrtime();
    }

    get entityModel()   { return this._entityModel; }
    get worldModel()    { return this._worldModel; }
    get outputBuffer()  { return this._outputBuffer; }

    addInput(meta, avatar) {
        this._inputBuffer.addInput(meta, avatar)
    }

    update() {
        this._updater.update(this._inputBuffer.getInput());

        // TODO decouple solver
        //this._solver.solve();
        let Δt = process.hrtime(this._stamp)[1];
        Newton.solve(this, Δt);
        this._stamp = process.hrtime();

        this._inputBuffer.flush();
    }

    getOutput() {
        return this._outputBuffer.getOutput();
    }

    flushOutput() {
        this._outputBuffer.flushOutput(this._entityModel.entities);
    }

    shuffleGravity() {
        let g = Newton.gravity;
        // Circular permutation.
        Newton.gravity = [g[2], g[0], g[1]];
    }

}

export default PhysicsEngine;
