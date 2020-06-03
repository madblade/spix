'use strict';

class XCollider
{
    static xCollide(oldPosition, newPosition, world, xModel)
    {
        let chk = world.getChunkByCoordinates(...oldPosition);
        if (!chk) return;

        let xs = xModel.getPortalsFromChunk(world.worldId, chk.chunkId);
        if (!xs || xs.size < 1) return;

        let portals = xModel.portals;
        // TODO [MEDIUM] collide with head instead of entity center.
        const op = oldPosition;
        const np = newPosition;

        let arr = [];
        xs.forEach(xId => arr.push(xId));

        for (let i = 0, l = arr.length; i < l; ++i) {
            let xId = arr[i];
            let portal = portals.get(xId);

            // [...this._block1, ...this._block2, this._position, this._orientation]
            let state = portal.state;
            let x0 = state[0]; let y0 = state[1]; let z0 = state[2];
            let x1 = state[3]; let y1 = state[4]; let z1 = state[5];
            let p = state[6]; // Ratio towards +
            let o = state[7]; // Orientation if ambiguous.

            let sum = 0 + (x1 === x0) + (y1 === y0) + (z1 === z0);
            const opx = op[0]; const opy = op[1]; const opz = op[2];
            const npx = np[0]; const npy = np[1]; const npz = np[2];
            if (sum === 2)
            {
                let axis = x1 !== x0 ? 'x' : y1 !== y0 ? 'y' : z1 !== z0 ? 'z' : '?';

                // x1 = cos alpha  ;  x2 = cos (alpha + beta) = cos alpha cos beta - sin alpha sin beta
                // y1 = sin alpha  ;  y2 = sin (alpha + beta) = sin alpha cos beta + cos alpha sin beta
                // x2 = x1 cos beta - y1 sin beta
                // y2 = y1 cos beta + x1 sin beta
                let beta = -parseFloat(o);
                if (axis === 'x') beta += Math.PI / 2;
                if (axis === 'y') beta = -beta + Math.PI / 2;
                let cosBeta = Math.cos(beta); let sinBeta = Math.sin(beta);
                let transform = (inputX, inputY, inputZ) =>
                    [inputX * cosBeta - inputY * sinBeta, inputY * cosBeta + inputX * sinBeta, inputZ];

                let fx0; let fx1; let fy0; let fy1; let fz0; let fz1;
                let cosAlphaO; let sinAlphaO; let cosAlphaN; let sinAlphaN;
                let oT; let nT;

                // Perform rotation with the sine sum formula to simplify collision.
                switch (axis) {
                    case 'x': // Warn! for 'x', 'first' is z.
                        cosAlphaO = opz - (z0 + 0.5); sinAlphaO = opy - (y0 + 0.5);
                        cosAlphaN = npz - (z0 + 0.5); sinAlphaN = npy - (y0 + 0.5);
                        oT = transform(cosAlphaO, sinAlphaO, opx);
                        nT = transform(cosAlphaN, sinAlphaN, npx);
                        oT[0] += z0 + 0.5; nT[0] += z0 + 0.5;
                        oT[1] += y0 + 0.5; nT[1] += y0 + 0.5;

                        fx0 = z0 + 0.5;                 fx1 = fx0;
                        fy0 = Math.min(y0, y1);         fy1 = Math.max(y0, y1) + 1;
                        fz0 = Math.min(x0, x1) + 0.5;   fz1 = Math.max(x0, x1) + 1.5;

                        // if (oT[0] > fx0 && nT[0] < fx1 || oT[0] < fx0 && nT[0] > fx1) {
                        //     console.log('[XXX] Normal breached');
                        // }
                        break;

                    case 'y':
                        cosAlphaO = opx - (x0 + 0.5); sinAlphaO = opz - (z0 + 0.5);
                        cosAlphaN = npx - (x0 + 0.5); sinAlphaN = npz - (z0 + 0.5);
                        oT = transform(cosAlphaO, sinAlphaO, opy);
                        nT = transform(cosAlphaN, sinAlphaN, npy);
                        oT[0] += x0 + 0.5; nT[0] += x0 + 0.5;
                        oT[1] += z0 + 0.5; nT[1] += z0 + 0.5;

                        fx0 = x0 + 0.5;               fx1 = fx0;
                        fy0 = Math.min(z0, z1);       fy1 = Math.max(z0, z1) + 1;
                        fz0 = Math.min(y0, y1) + 0.5; fz1 = Math.max(y0, y1) + 1.5;

                        // if (oT[0] > fx0 && nT[0] < fx1 || oT[0] < fx0 && nT[0] > fx1) {
                        //     console.log('[YYYY] Normal breached');
                        // }
                        break;

                    case 'z':
                        cosAlphaO = opx - (x0 + 0.5); sinAlphaO = opy - (y0 + 0.5);
                        cosAlphaN = npx - (x0 + 0.5); sinAlphaN = npy - (y0 + 0.5);
                        oT = transform(cosAlphaO, sinAlphaO, opz);
                        nT = transform(cosAlphaN, sinAlphaN, npz);
                        oT[0] += x0 + 0.5; nT[0] += x0 + 0.5;
                        oT[1] += y0 + 0.5; nT[1] += y0 + 0.5;

                        fx0 = x0 + 0.5;               fx1 = fx0;
                        fy0 = Math.min(y0, y1);       fy1 = Math.max(y0, y1) + 1;
                        fz0 = Math.min(z0, z1) + 0.5; fz1 = Math.max(z0, z1) + 1.5;

                        // if (oT[0] > fx0 && nT[0] < fx1 || oT[0] < fx0 && nT[0] > fx1) {
                        //     console.log('[DEBUG/XCollision] Normal breached');
                        // }
                        break;

                    default:
                        console.log('[XCollide] Unmanaged portal orientation.');
                        return;
                }

                // Perform collision
                if ((oT[0] > fx0 && nT[0] < fx1 || oT[0] < fx0 && nT[0] > fx1) &&
                    oT[1] > fy0 && oT[1] < fy1 && nT[1] > fy0 && nT[1] < fy1 &&
                    oT[2] + .5 > fz0 && oT[2] + .5 < fz1 && nT[2] + .5 > fz0 && nT[2] + .5 < fz1
                ) return xModel.getOtherSide(xId);
            }

            // Big portals
            // TODO [LOW] Manage.
            else if (sum === 1)
            {
                let axis = x1 === x0 ? 'x' : y1 === y0 ? 'y' : z1 === z0 ? 'z' : '?';
                let fx0; let fx1; let fy0; let fy1; let fz0; let fz1;

                switch (axis)
                {
                    case 'x':
                        fx0 = x0 + p;               fx1 = fx0;
                        fy0 = Math.min(y0, y1);     fy1 = Math.max(y0, y1) + 1;
                        fz0 = Math.min(z0, z1);     fz1 = Math.max(z0, z1) + 1;

                        if ((opx > fx0 && npx < fx1 || opx < fx0 && npx > fx1) &&
                            opy > fy0 && opy < fy1 && npy > fy0 && npy < fy1 &&
                            opz + .5 > fz0 && opz + .5 < fz1 && npz + .5 > fz0 && npz + .5 < fz1)
                        {
                            // Do collide & change world
                            // TODO [HIGH] Manage collisions with things on the other side.
                            return xModel.getOtherSide(xId);
                        }
                        break;

                    case 'y':
                        fx0 = Math.min(x0, x1);     fx1 = Math.max(x0, x1);
                        fy0 = y0 + p;               fy1 = fy0;
                        fz0 = Math.min(z0, z1);     fz1 = Math.max(z0, z1);

                        if (opx > fx0 && opx < fx1 && npx > fx0 && npx < fx1 &&
                            (opy > fy0 && npy < fy1 || opy < fy0 && npy > fy1) &&
                            opz + .5 > fz0 && opz + .5 < fz1 && npz + .5 > fz0 && npz + .5 < fz1)
                        {
                            return xModel.getOtherSide(xId);
                        }
                        break;

                    case 'z':
                        fx0 = Math.min(x0, x1);     fx1 = Math.max(x0, x1);
                        fy0 = Math.min(y0, y1);     fy1 = Math.max(y0, y1);
                        fz0 = z0 + p;               fz1 = fz0;

                        if (opx > fx0 && opx < fx1 && npx > fx0 && npx < fx1 &&
                            opy > fy0 && opy < fy1 && npy > fy0 && npy < fy1 &&
                            (opz + .5 < fz0 && npz + .5 > fz1 || opz + .5 > fz0 && npz + .5 < fz1))
                        {
                            return xModel.getOtherSide(xId);
                        }
                        break;

                    default: console.log('[XCollide] Unmanaged portal orientation.');
                }
            }
            else {
                console.log(`[XCollide] Error: portal orientation could not be determined: ${sum}`);
            }
        }

        return false;
    }
}

export default XCollider;
