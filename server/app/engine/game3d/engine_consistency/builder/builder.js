/**
 * Extract chunk surfaces and build hierarchy.
 */

'use strict';

import Extractor from './extractor';

class Builder {

    constructor(consistencyEngine) {
        // Models.
        this._worldModel        = consistencyEngine.worldModel;
        this._consistencyModel  = consistencyEngine.consistencyModel;
    }

    computeChunksForNewPlayer(player) {
        return Extractor.computeChunksForNewPlayer(player, this._worldModel);
    }

    computeNewChunksInRangeForPlayer(player) {
        return Extractor.computeNewChunksInRangeForPlayer(player, this._worldModel, this._consistencyModel);
    }

}

export default Builder;
