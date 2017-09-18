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

        let originWorld = parseInt(avatar.worldId);

        let x1 = parseInt(meta[1]), y1 = parseInt(meta[2]), z1 = parseInt(meta[3]);

        if (meta[0] === 'add') {
            let x2 = parseInt(meta[4]), y2 = parseInt(meta[5]), z2 = parseInt(meta[6]);
            let offset = parseFloat(meta[7]);
            let o = meta[8];
            let orientation = (o === 0) ? 'first': 'next';
            let portalToLink = meta[9];
            if (portalToLink) portalToLink = parseInt(portalToLink);
            xModel.addPortal(originWorld, x1, y1, z1, x2, y2, z2, offset, orientation, portalToLink);
        } else if (meta[0] === 'del') {
            xModel.removePortalFromPosition(originWorld, x1, y1, z1);
        }

    }

}

export default XUpdater;
