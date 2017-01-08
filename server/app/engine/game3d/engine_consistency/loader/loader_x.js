/**
 *
 */

'use strict';

class XLoader {

    constructor(consistencyEngine) {
        this._xModel = consistencyEngine.xModel;
        this._worldModel = consistencyEngine.worldModel;
    }

    computeNewXInRange(player) {
        let a = player.avatar;
        let p = a.position;
        let worldId = a.worldId;
        let wm = this._worldModel;
        let xm = this._xModel;

        let chunk = wm.getWorld(worldId).getChunkByCoordinates(...p);

        let portals = xm.getConnectivity(chunk.chunkId, worldId);

        // TODO [CRIT] continue here and on portals...
    }

}

export default XLoader;
