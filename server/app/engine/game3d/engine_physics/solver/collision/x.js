'use strict';

class XCollider {

    static xCollide(oldPosition, newPosition, world, xModel) {

        let chk = world.getChunkByCoordinates(...oldPosition);

        let xs = xModel.getPortalsFromChunk(world.worldId, chk.chunkId);

        let portals = xModel.portals;

        if (!xs || xs.size < 1) return;
        const op = oldPosition;
        const np = newPosition;

        let arr = [];
        xs.forEach(xId => arr.push(xId));

        for (let i = 0, l = arr.length; i < l; ++i) {
            let xId = arr[i];
            let portal = portals.get(xId);
            
            // [...this._block1, ...this._block2, this._position, this._orientation]
            let state = portal.state; 
            let x0 = state[0], y0 = state[1], z0 = state[2];
            let x1 = state[3], y1 = state[4], z1 = state[5];
            let p = parseFloat(state[6]); // Ratio towards +

            let sum = 0 + (x1 === x0) + (y1 === y0) + (z1 === z0);
            // TODO [CRIT] fix that asap.
            // TODO [CRIT] compute intersection point (or locigally test for it)
            if (sum !== 2) {
                console.log('XCollide error: portal orientation could not be determined: ' + sum);
            }

            let axis = x1 === x0 ? 'x' : y1 === y0 ? 'y' : z1 === z0 ? 'z' : '?';
            let fx0, fx1, fy0, fy1, fz0, fz1;
            
            switch (axis) {
                
                case 'x':
                    fx0 = x0 + p;               fx1 = fx0;
                    fy0 = Math.min(y0, y1);     fy1 = Math.max(y0, y1) + 1;
                    fz0 = Math.min(z0, z1);     fz1 = Math.max(z0, z1) + 1;

                    if ((op[0] > fx0 && np[0] < fx1 || op[0] < fx0 && np[0] > fx1) &&
                        op[1] > fy0 && op[1] < fy1 && np[1] > fy0 && np[1] < fy1 &&
                        op[2]+.5 > fz0 && op[2]+.5 < fz1 && np[2]+.5 > fz0 && np[2]+.5 < fz1
                       )
                    {
                        // Do collide & change world
                        // TODO [HIGH] Manage collisions with things on the other side.
                        return xModel.getOtherSide(xId);
                    }

                    break;

                // TODO [HIGH] implement wiser
                case 'y':
                    fx0 = Math.min(x0, x1);     fx1 = Math.max(x0, x1);
                    fy0 = y0 + p;               fy1 = fy0;
                    fz0 = Math.min(z0, z1);     fz1 = Math.max(z0, z1);

                    if (op[0] > fx0 && op[0] < fx1 && np[0] > fx0 && np[0] < fx1 &&
                        (op[1] > fy0 && np[1] < fy1 || op[1] < fy0 && np[1] > fy1) &&
                        op[2]+.5 > fz0 && op[2]+.5 < fz1 && np[2]+.5 > fz0 && np[2]+.5 < fz1
                       )
                    {
                        return xModel.getOtherSide(xId);
                    }

                    break;

                case 'z':
                    fx0 = Math.min(x0, x1);     fx1 = Math.max(x0, x1);
                    fy0 = Math.min(y0, y1);     fy1 = Math.max(y0, y1);
                    fz0 = z0 + p;               fz1 = fz0;

                    if (op[0] > fx0 && op[0] < fx1 && np[0] > fx0 && np[0] < fx1 &&
                        op[1] > fy0 && op[1] < fy1 && np[1] > fy0 && np[1] < fy1 &&
                        (op[2]+.5 < fz0 && np[2]+.5 > fz1 || op[2]+.5 > fz0 && np[2]+.5 < fz1)
                       )
                    {
                        return xModel.getOtherSide(xId);
                    }

                    break;
                
                default:
            }
        }
        
        return false;

    }

}

export default XCollider;
