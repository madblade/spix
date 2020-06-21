/**
 * Handles avatar position and rotation interpolation.
 */

'use strict';

import { Vector3, Vector4 } from 'three';

let SelfInterpolationModule = {

    _d42(v41, v42)
    {
        const dx = v41.x - v42.x;
        const dy = v41.y - v42.y;
        const dz = v41.z - v42.z;
        const dw = v41.w - v42.w;
        return dx * dx + dy * dy + dz * dz + dw * dw;
    },

    interpolatePredictSelfPosition()
    {
        let lastP = this.lastPositionFromServer;
        let currentP = this.currentPositionFromServer;
        let lastR = this.lastRotationFromServer;
        let currentR = this.currentRotationFromServer;
        let p = this.position;
        let r = this.rotation;
        let upToDatePosition = new Vector3(p.x, p.y, p.z); // "up-to-date" server position
        let upToDateRotation = new Vector4(r[0], r[1], r[2], r[3]); // "up-to-date" rotation
        const updateTime = this.getTime();
        // const deltaClient = updateTime - this.lastClientUpdateTime;
        // this.lastClientUpdateTime = updateTime;

        if (
            currentP.distanceTo(upToDatePosition) > 0 ||
            this._d42(currentR, upToDateRotation) > 0)
        {
            // changed!
            lastP.copy(currentP);
            currentP.copy(upToDatePosition);
            lastR.copy(currentR);
            currentR.copy(upToDateRotation);

            // compute average delta.
            const deltaServer = updateTime - this.lastServerUpdateTime;
            // if (this.averageDeltaT < 16 || this.averageDeltaT > 100) {
            this.averageDeltaT = deltaServer;
            // }
            this.lastServerUpdateTime = updateTime;
        }

        const t = updateTime - this.lastServerUpdateTime;
        const deltaServer = this.averageDeltaT;
        if (t < deltaServer) {
            // interpolate
            const tdt = t / deltaServer;
            const dxp = currentP.x - lastP.x; const dxr = currentR.x - lastR.x;
            const dyp = currentP.y - lastP.y; const dyr = currentR.y - lastR.y;
            const dzp = currentP.z - lastP.z; const dzr = currentR.z - lastR.z;
            const dwr = currentR.w - lastR.w;
            // let pv = this.predictedVelocity;
            // let ip = this.interpolatingPosition;
            // pv.copy(ip);
            this.setLerp(
                lastP.x + tdt * dxp, lastP.y + tdt * dyp, lastP.z + tdt * dzp,
                lastR.x + tdt * dxr, lastR.y + tdt * dyr, lastR.z + tdt * dzr,
                lastR.w + tdt * dwr
            );
            // pv.set(ip.x - pv.x, ip.y - pv.y, ip.z - pv.z);
        }
        // Prediction goes there (but must be queried for every game update,
        // this pass here is already filtered)
        // } else if (t < 2 * deltaServer) {
        //     let pv = this.predictedVelocity;
        //     let ip = this.interpolatingPosition;
        //     this.setLerp(ip.x + pv.x, ip.y + pv.y, ip.z + pv.z);
        //     this.lastInterpolatingPosition.copy(this.interpolatingPosition);
        else if (
            this.interpolatingPosition.distanceTo(currentP) > 0 ||
            this._d42(this.interpolatingRotation, currentR) > 0
        )
        {
            this.interpolationUpToDate = true;
            this.setLerp(
                currentP.x, currentP.y, currentP.z,
                currentR.x, currentR.y, currentR.z, currentR.w
            );
            // }
            // Correction goes there (go back to the last updated)
            // const tdt = (t - 2 * deltaServer) / deltaServer;
            // if (tdt < 1) {
            //     const cp = this.lastInterpolatingPosition;
            //     const dx = last.x - cp.x;
            //     const dy = last.x - cp.y;
            //     const dz = last.x - cp.z;
            //     this.setLerp(last.x + tdt * dx, last.y + tdt * dy, last.z + tdt * dz);
            // } else
        }

        if (this.needsWorldSwitchRetry)
            this.interpolateSwitchWorld();
    },

    setLerp(xp, yp, zp, xr, yr, zr, wr)
    {
        // Rotation
        this.interpolatingRotation.set(xr, yr, zr, wr);
        this.updateRotation(this.avatar, this.interpolatingRotation);

        // Update interpolating position before world cross check
        this.interpolatingPosition.set(xp, yp, zp);

        // World switch
        if (this.worldNeedsUpdate && this.oldWorldId)
        {
            if (this.interpolationUpToDate)
            {
                // failed to collide earlier, or the player is moving really fast
                this.interpolateSwitchWorld();
            }
            else
            {
                this.intersectPortals(
                    this.avatar.position,
                    this.interpolatingPosition
                );
            }
        }

        // Update avatar position after world cross check
        this.updatePosition(this.avatar, this.interpolatingPosition);
    },

    interpolateSwitchWorld()
    {
        let graphics = this.app.engine.graphics;
        if (!graphics.sceneManager.hasScene(this.newWorldId))
        {
            console.warn('[UpdateWorld] New world not loaded yet, retrying to switch later.');
            this.interpolationUpToDate = false;
            this.needsWorldSwitchRetry = true;
            return;
        }
        this.worldId = this.newWorldId;

        this.updateWorld();
        let p = this.position;
        let last = this.lastPositionFromServer;
        let current = this.currentPositionFromServer;
        last.copy(current);
        current.copy(p);
        this.interpolatingPosition.copy(p);
        this.updatePosition(this.avatar, this.interpolatingPosition);
        this.interpolationUpToDate = true;
        this.worldNeedsUpdate = false;
        this.needsWorldSwitchRetry = false;
    },

    intersectPortals(
        oldPosition,
        newPosition
    )
    {
        let portals = this.xModel.portals;
        let worldsToPortals = this.xModel.worldToPortals;
        const oldWorldId = parseInt(this.oldWorldId, 10);

        // I just crossed a portal from the old world.
        let potentiallyCrossed = worldsToPortals.get(oldWorldId);
        if (!potentiallyCrossed)
        {
            console.warn(`[Self/Interpolate] Didn’t find any portal in world ${oldWorldId}.`);
            return;
        }

        const opx = oldPosition.x;
        const opy = oldPosition.y;
        const opz = oldPosition.z;
        const npx = newPosition.x;
        const npy = newPosition.y;
        const npz = newPosition.z;

        let found = false;
        potentiallyCrossed.forEach(id => {
            if (found) return; // how does one short-circuit a forEach again?
            if (!id) return;
            const portal = portals.get(id);
            if (!portal)
            {
                console.warn(`[Self/Intersection] Portal not found: ${id}.`);
            }

            if (!portal.tempPosition || !portal.tempOtherPosition || !portal.tempPosition.length)
            {
                console.warn(`[Self/Intersection] Corrupt portal found: ${id}.`);
                return;
            }
            const x0 = parseFloat(portal.tempPosition[0]);
            const y0 = parseFloat(portal.tempPosition[1]);
            const z0 = parseFloat(portal.tempPosition[2]);
            const x1 = parseFloat(portal.tempOtherPosition[0]);
            const y1 = parseFloat(portal.tempOtherPosition[1]);
            const z1 = parseFloat(portal.tempOtherPosition[2]);
            // let p = state[6]; // Ratio towards +
            let o = parseFloat(portal.tempOrientation); // Orientation if ambiguous.
            const pid = portal.portalId;

            let sum = 0 + (x1 === x0) + (y1 === y0) + (z1 === z0);
            if (sum !== 2)
            {
                console.warn(`[Self/Intersection] Invalid portal found: ${pid}.`);
                return;
            }

            // | This is the same collision routine as in the server.
            // V
            let axis = x1 !== x0 ? 'x' : y1 !== y0 ? 'y' : z1 !== z0 ? 'z' : '?';

            let beta = -parseFloat(o);
            if (axis === 'x') beta += Math.PI / 2;
            if (axis === 'y') beta = -beta + Math.PI / 2;
            let cosBeta = Math.cos(beta); let sinBeta = Math.sin(beta);
            let transform = (inputX, inputY, inputZ) =>
                [inputX * cosBeta - inputY * sinBeta, inputY * cosBeta + inputX * sinBeta, inputZ];

            let fx0; let fx1; let fy0; let fy1; let fz0; let fz1;
            let cosAlphaO; let sinAlphaO; let cosAlphaN; let sinAlphaN;
            let oT; let nT;

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
                    break;

                default:
                    console.log('[XCollide] Unmanaged portal orientation.');
                    return;
            }

            // Perform collision
            const crossedX = oT[0] > fx0 && nT[0] < fx1 || oT[0] < fx0 && nT[0] > fx1;
            const inY = oT[1] > fy0 && oT[1] < fy1 && nT[1] > fy0 && nT[1] < fy1;
            const inZ = oT[2] + .5 > fz0 && oT[2] + .5 < fz1 && nT[2] + .5 > fz0 && nT[2] + .5 < fz1;
            if (
                crossedX && inY && inZ
            ) {
                // Perform world switch here!
                found = true;
                this.interpolateSwitchWorld();
            }
        });
    },

};

export { SelfInterpolationModule };
