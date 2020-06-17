/**
 *
 */

'use strict';

import UpdaterAccess from '../../engine_topology/updater/updater_access';

class XUpdater
{
    constructor(consistencyEngine)
    {
        this._worldModel = consistencyEngine.worldModel;
        this._xModel = consistencyEngine.xModel;
        this._consistencyModel = consistencyEngine.consistencyModel;
        this._entityModel = consistencyEngine.entityModel;
    }

    update(avatar, data)
    {
        // let worldModel = this._worldModel;
        let xModel = this._xModel;
        // let consistencyModel = this._consistencyModel;

        // let action = data.action; // 'gate'
        let meta = data.meta;

        const originWorld = parseInt(avatar.worldId, 10);

        const x1 = parseInt(meta[1], 10);
        const y1 = parseInt(meta[2], 10);
        const z1 = parseInt(meta[3], 10);

        let world = this._worldModel.getWorld(avatar.worldId);
        let em = this._entityModel;
        let a = UpdaterAccess.requestAddBlock(avatar, x1, y1, z1, world, em);
        if (!a) return;

        if (meta[0] === 'add')
        {
            const x2 = parseInt(meta[4], 10);
            const y2 = parseInt(meta[5], 10);
            const z2 = parseInt(meta[6], 10);
            a = UpdaterAccess.requestAddBlock(avatar, x2, y2, z2, world, em);
            if (!a) return;

            const offset = parseFloat(meta[7]);
            const o = parseFloat(meta[8]);
            const orientation = typeof o === 'number' ? o : 0;
            const isOrangeOrBlue = meta[9];
            let portalToLink = null;
            if (!isOrangeOrBlue) // portal to another world
            {
                xModel.addPortal(
                    originWorld,
                    x1, y1, z1, x2, y2, z2,
                    offset, orientation,
                    portalToLink, true
                );
            }
            else // portal linked to other player’s portal
            {
                const isBlue = meta[10];
                const isOrange = !isBlue;
                if (!isBlue && !isOrange)
                {
                    console.warn('[Updater/X] Specified portal is neither blue nor orange.');
                    return;
                }
                const blue = avatar.bluePortal;
                const orange = avatar.orangePortal;
                const hasBlue = blue !== null;
                const hasOrange = orange !== null;
                if (isBlue && hasBlue || isOrange && hasOrange)
                {
                    console.log('[Updater/X] TODO: manage portal edition / deletion.');
                    // return;
                }
                else if (isBlue && hasOrange || isOrange && hasBlue)
                {
                    portalToLink = isBlue ? orange.portalId : blue.portalId;
                    let newPortal = xModel.addPortal(
                        originWorld,
                        x1, y1, z1, x2, y2, z2,
                        offset, orientation,
                        portalToLink, false
                    );
                    if (!newPortal)
                    {
                        console.error('[Updater/X] Failed to link to a new portal.');
                        return;
                    }
                    if (isBlue) avatar.bluePortal = newPortal;
                    else if (isOrange) avatar.orangePortal = newPortal;
                }
                else
                {
                    let newPortal = xModel.addPortal(
                        originWorld,
                        x1, y1, z1, x2, y2, z2,
                        offset, orientation,
                        null, false
                    );
                    if (!newPortal)
                    {
                        console.error('[Updater/X] Failed to create a new portal.');
                        return;
                    }
                    if (isBlue) avatar.bluePortal = newPortal;
                    else if (isOrange) avatar.orangePortal = newPortal;
                }
            }
        }
        else if (meta[0] === 'del')
        {
            xModel.removePortalFromPosition(originWorld, x1, y1, z1);
        }
    }
}

export default XUpdater;
