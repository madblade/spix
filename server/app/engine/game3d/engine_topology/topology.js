/**
 *
 */

'use strict';

import InputBuffer      from './input_buffer';
import OutputBuffer     from './output_buffer';

import Generator        from './generator/generator';
import Builder          from './builder/builder';
import Loader           from './loader/loader';
import Extractor        from './extractor/extractor';
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
        this._generator     = new Generator(this);
        this._builder       = new Builder(this);
        this._loader        = new Loader(this);
        this._extractor     = new Extractor(this);
        this._updater       = new Updater(this); // Needs Accessor
    }

    get entityModel() { return this._entityModel; }
    get worldModel()  { return this._worldModel; }
    get accessor()    { return this._accessor; }
    get extractor()   { return this._extractor; }

    addInput(meta, avatar) {
        this._inputBuffer.push(meta, avatar);
    }

    update() {
        this._updater.update(this._inputBuffer.getInput());
        this._inputBuffer.flush();
    }

    getOutput() {
        return this._outputBuffer.getOutput();
    }

}

export default TopologyEngine;
