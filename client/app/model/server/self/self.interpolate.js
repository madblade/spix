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
            this.setLerp(
                currentP.x, currentP.y, currentP.z,
                currentR.x, currentR.y, currentR.z, currentR.w
            );
            this.interpolationUpToDate = true;
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
    },

    setLerp(xp, yp, zp, xr, yr, zr, wr)
    {
        this.interpolatingPosition.set(xp, yp, zp);
        this.interpolatingRotation.set(xr, yr, zr, wr);
        this.updatePosition(this.avatar, this.interpolatingPosition);
        this.updateRotation(this.avatar, this.interpolatingRotation);
    }

};

export { SelfInterpolationModule };
