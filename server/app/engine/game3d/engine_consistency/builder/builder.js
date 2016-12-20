/**
 * Extract chunk surfaces and build hierarchy.
 */

'use strict';

import Extractor from './extractor';

class Builder {

    constructor(consistencyEngine) {
        this._worldModel = consistencyEngine.worldModel;
    }

    computeChunksForNewPlayer(player) {
        return Extractor.computeChunksForNewPlayer(player, this._worldModel);
    }

    computeNewChunksInRangeForPlayer(player) {
        return Extractor.computeNewChunksInRangeForPlayer(player, this._worldModel);
    }

}

export default Builder;
