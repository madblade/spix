/**
 *
 */

'use strict';

class XUpdater {

    constructor(consistencyEngine) {
        this._worldModel = consistencyEngine.worldModel;
        this._xModel = consistencyEngine.xModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
    }

    update(avatar, data) {
        let worldModel = this._worldModel;
        let xModel = this._xModel;
        let consistencyModel = this._consistencyModel;

        // let action = data.action; // 'gate'
        let meta = data.meta;

        let originWorld = avatar.worldId;
        let portalToLink = meta[4];

        let x = meta[1], y = meta[2], z = meta[3];

        if (meta[0] === 'add') {
            xModel.addPortal(originWorld, x, y, z, x, y, z+1, 0.999, 'both', portalToLink);
        } else if (meta[0] === 'del') {
            xModel.removePortalFromPosition(originWorld, x, y, z);
        }

    }

}

export default XUpdater;
