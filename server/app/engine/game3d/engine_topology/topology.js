/**
 *
 */

'use strict';

import InputBuffer      from './input_buffer';
import OutputBuffer     from './output_buffer';

import Selector         from './selector/selector';
import Updater          from './updater/updater';
import Accessor         from './accessor/accessor';

class TopologyEngine {

    constructor(game) {
        // Models.
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        this._xModel        = game.xModel;

        // Buffers.
        this._inputBuffer   = new InputBuffer();
        this._outputBuffer  = new OutputBuffer();

        // Engine.
        this._accessor      = new Accessor(this);
        this._selector      = new Selector(this);
        this._updater       = new Updater(this); // Needs Accessor
    }

    get entityModel()  { return this._entityModel; }
    get worldModel()   { return this._worldModel; }
    get accessor()     { return this._accessor; }
    get extractor()    { return this._selector; }
    get outputBuffer() { return this._outputBuffer; }

    addInput(meta, avatar) {
        this._inputBuffer.addInput(meta, avatar);
    }

    update() {
        this._updater.update(this._inputBuffer.getInput());
        this._inputBuffer.flush();
    }

    // Get (chunk id, blocks) map for updated chunks.
    getOutput() {
        return this._outputBuffer.getOutput(this._worldModel.allChunks);
    }

    // Get (chunk id, updates) object for updated chunks concerning specific player.
    // TODO put in consistency model.
    getOutputForPlayer(p, updatedChunks) {
        return this._selector.selectUpdatedChunksForPlayer(p, this._worldModel.allChunks, updatedChunks);
    }

    flushOutput() {
        this._outputBuffer.flushOutput(this._worldModel.allChunks);
    }

}

export default TopologyEngine;
