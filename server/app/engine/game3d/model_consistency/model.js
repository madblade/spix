/**
 *
 */

'use strict';

class ConsistencyModel {

    constructor(game) {
        // Model.
        this._worldModel    = game.worldModel;
        this._entityModel   = game.entityModel;
        this._xModel        = game.xModel;

        // Internals.
        this._entityIdsForEntity = new Map();
        this._chunkIdsForEntity  = new Map();
        this._chunkIdAndPartsForEntity = new Map();
    }



}

export default ConsistencyModel;
