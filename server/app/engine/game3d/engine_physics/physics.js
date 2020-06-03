/**
 *
 */

'use strict';

import InputBuffer      from './input_buffer';
import OutputBuffer     from './output_buffer';

import FrontEnd         from './solver/frontend';
import Updater          from './updater/updater';

class PhysicsEngine
{
    constructor(game) {
        // Models.
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        this._xModel        = game.xModel;

        // Buffers.
        this._inputBuffer   = new InputBuffer();
        this._outputBuffer  = new OutputBuffer();

        // Engine.
        this._updater       = new Updater(this); // Parses input and updates model constraints.
        this._frontend      = new FrontEnd(this, game.refreshRate);  // Updates physical model.
    }

    get entityModel()   { return this._entityModel; }
    get worldModel()    { return this._worldModel; }
    get xModel()        { return this._xModel; }
    get outputBuffer()  { return this._outputBuffer; }

    /** ######################## **/

    addInput(meta, avatar) {
        this._inputBuffer.addInput(meta, avatar);
    }

    update() {
        let input = this._inputBuffer.getInput();

        this._updater.update(input);

        this._frontend.solve();

        this._inputBuffer.flush();
    }

    getOutput() {
        return this._outputBuffer.getOutput();
    }

    /** ######################## **/

    flushOutput() {
        this._outputBuffer.flushOutput();
    }

    shuffleGravity() {
        this._frontend.shuffleGravity();
    }

    /** **/

    spawnPlayer(player) {
        this._frontend.objectOrderer.addObject(player.avatar);
    }

    removePlayer(playerId) {
        let entity = this._entityModel.entities[playerId];
        this._frontend.objectOrderer.removeObject(entity);
    }
}

export default PhysicsEngine;
