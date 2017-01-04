/**
 *
 */

'use strict';

import InputBuffer      from './input_buffer';
import OutputBuffer     from './output_buffer';

import Selector         from './selector/selector';
import Updater          from './updater/updater';

class TopologyEngine {

    constructor(game) {
        // Models.
        this._entityModel       = game.entityModel;
        this._worldModel        = game.worldModel;
        this._xModel            = game.xModel;
        this._consistencyModel  = game.consistencyModel;

        // Buffers.
        this._inputBuffer       = new InputBuffer();
        this._outputBuffer      = new OutputBuffer();

        // Engine.
        this._selector          = new Selector(this); // Extracts subsets for players.
        this._updater           = new Updater(this);  // Updates model. Needs Accessor.
    }

    get entityModel()           { return this._entityModel; }
    get worldModel()            { return this._worldModel; }
    get selector()              { return this._selector; }
    get outputBuffer()          { return this._outputBuffer; }

    addInput(meta, avatar) {
        // Security: copy avatar state before physics engine updates positions and world translations.
        let pos = avatar.position;
        let secureAvatar = { position: [pos[0], pos[1], pos[2]], worldId: avatar.worldId};

        this._inputBuffer.addInput(meta, secureAvatar);
    }

    update() {
        this._updater.update(this._inputBuffer.getInput());
        this._inputBuffer.flush();
    }

    // Get (chunk id, blocks) map for updated chunks.
    getOutput() {
        return this._outputBuffer.getOutput();
    }

    // Get (chunk id, updates) object for updated chunks concerning specific player.
    // TODO [HIGH] put in consistency model.
    getOutputForPlayer(p, updatedChunks, newChunks) {
        let worldModel = this._worldModel;
        let consistencyModel = this._consistencyModel;
        return this._selector.selectUpdatedChunksForPlayer(p, worldModel, consistencyModel, updatedChunks, newChunks);
    }

    flushOutput() {
        this._outputBuffer.flushOutput(this._worldModel);
    }

}

export default TopologyEngine;
