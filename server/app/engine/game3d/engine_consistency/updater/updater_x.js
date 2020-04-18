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
        // let worldModel = this._worldModel;
        let xModel = this._xModel;
        // let consistencyModel = this._consistencyModel;

        // let action = data.action; // 'gate'
        let meta = data.meta;

        let originWorld = parseInt(avatar.worldId, 10);

        let x1 = parseInt(meta[1], 10);
        let y1 = parseInt(meta[2], 10);
        let z1 = parseInt(meta[3], 10);

        if (meta[0] === 'add') {
            let x2 = parseInt(meta[4], 10);
            let y2 = parseInt(meta[5], 10);
            let z2 = parseInt(meta[6], 10);
            let offset = parseFloat(meta[7]);
            let o = parseFloat(meta[8]);
            let orientation = typeof o === 'number' ? o : 0; // o === 0 ? 'first' : 'next';
            let portalToLink = meta[9];
            if (portalToLink) portalToLink = parseInt(portalToLink, 10);
            xModel.addPortal(originWorld, x1, y1, z1, x2, y2, z2, offset, orientation, portalToLink);
        } else if (meta[0] === 'del') {
            xModel.removePortalFromPosition(originWorld, x1, y1, z1);
        }
    }

}

export default XUpdater;
