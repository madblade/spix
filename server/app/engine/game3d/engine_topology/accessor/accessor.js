/**
 *
 */

'use strict';

import NumberUtils from '../../../math/numbers';

class Accessor {

    constructor(topologyEngine) {
        this._worldModel = topologyEngine.worldModel;
    }

    getChunkCoordinatesFromFloatingPoint(x, y, z, floorX, floorY, floorZ) {
        const w = this._worldModel;

        const dx = w.chunkDimensionX;
        const dy = w.chunkDimensionY;
        const dz = w.chunkDimensionZ;

        const modX = (floorX >= 0 ? floorX : (dx + floorX)) % dx;
        const deltaX = modX === 0;

        const modY = (floorY >= 0 ? floorY : (dy + floorY)) % dy;
        const deltaY = modY === 0;

        const modZ = (floorZ >= 0 ? floorZ : (dz + floorZ)) % dz;
        const deltaZ = modZ === 0;

        const Dx = deltaX && NumberUtils.isEpsilon(Math.abs(Math.abs(x)-Math.abs(floorX)));
        const Dy = deltaY && NumberUtils.isEpsilon(Math.abs(Math.abs(y)-Math.abs(floorY)));
        const Dz = deltaZ && NumberUtils.isEpsilon(Math.abs(Math.abs(z)-Math.abs(floorZ)));

        let ijk = this.getChunkCoordinates(x, y, z);

        return [ijk[0], ijk[1], ijk[2], Dx, Dy, Dz];
    }

    getChunkCoordinates(x, y, z) {
        const w = this._worldModel;

        const dx = w.chunkDimensionX;
        const dy = w.chunkDimensionY;
        const dz = w.chunkDimensionZ;

        let f = Math.floor;
        let i = f(x/dx);
        let j = f(y/dy);
        let k = f(z/dz);

        return [i,j,k];
    }

}

export default Accessor;
