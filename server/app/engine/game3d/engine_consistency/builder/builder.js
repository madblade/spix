/**
 * Extract chunk surfaces and build hierarchy.
 */

'use strict';

import ExtractionAPI from './extractionapi';

class Builder {

    constructor(consistencyEngine) {
        this._worldModel = consistencyEngine.worldModel;
    }

    computeChunksForNewPlayer(player) {
        return ExtractionAPI.computeChunksForNewPlayer(player, this._worldModel);
    }

    computeNewChunksInRangeForPlayer(player) {
        return ExtractionAPI.computeNewChunksInRangeForPlayer(player, this._worldModel);
    }

}

export default Builder;
