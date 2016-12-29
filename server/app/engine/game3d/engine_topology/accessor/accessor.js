/**
 *
 */

'use strict';

import NumberUtils from '../../../math/numbers';

class Accessor {

    constructor(topologyEngine) {
        this._worldModel = topologyEngine.worldModel;
    }

    getChunkCoordinatesFromFloatingPoint(worldId, x, y, z, floorX, floorY, floorZ) {
        const w = this._worldModel.getWorld(worldId);

        const dx = w.xSize, dy = w.ySize, dz = w.zSize;

        const modX = (floorX >= 0 ? floorX : (dx + floorX)) % dx;
        const modY = (floorY >= 0 ? floorY : (dy + floorY)) % dy;
        const modZ = (floorZ >= 0 ? floorZ : (dz + floorZ)) % dz;

        const deltaX = modX === 0, deltaY = modY === 0, deltaZ = modZ === 0;

        const Dx = deltaX && NumberUtils.isEpsilon(Math.abs(Math.abs(x)-Math.abs(floorX)));
        const Dy = deltaY && NumberUtils.isEpsilon(Math.abs(Math.abs(y)-Math.abs(floorY)));
        const Dz = deltaZ && NumberUtils.isEpsilon(Math.abs(Math.abs(z)-Math.abs(floorZ)));

        let ijk = w.getChunkCoordinates(x, y, z);

        return [ijk[0], ijk[1], ijk[2], Dx, Dy, Dz];
    }

}

export default Accessor;
