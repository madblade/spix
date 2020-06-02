/**
 * Event processing.
 * Applies forces to or accelerates entities.
 * Compute entity desires.
 */

import EventOrderer from './orderer_events';
import Entity from '../../../model_entity/entity';
import RigidBodies from './rigid_bodies';
import { WorldType } from '../../../model_world/model';

class RigidBodiesPhase1
{
    static processLocalEvents(
        eventOrderer,
        entities,
        events,
        worldId,
        eventWorldAxes,
        oxAxis)
    {
        let exAxis = eventWorldAxes[0];
        // This uses only one axis to optimize solving
        // but could absolutely use the others.
        let lastEX = 0;
        let eventIndex; let entityIndex; let currentEvent;
        let op; let ep;
        let ox; let oy; let oz; let ex; let range;
        let wx; let wy; let wz;
        const maxRange = EventOrderer.maxRange;
        const maxWidth = Entity.maxWidth;

        // For all entities.
        for (let oi = 0, ol = oxAxis.length; oi < ol; ++oi)
        {
            let currentObject = oxAxis[oi];
            if (!currentObject) {
                console.log('Current object empty.');
                console.log(`Expected number of objects ${oxAxis.length}`);
                console.log(`Queried object index ${oi}`);
                console.log('oxAxis:');
                console.log(oxAxis);
            }

            if (!currentObject || currentObject.kind !== 'e') continue;
            entityIndex = oxAxis[oi].id;
            let currentEntity = entities[entityIndex];
            op = currentEntity.position;
            ox = op[0]; wx = currentEntity.widthX;
            oy = op[1]; wy = currentEntity.widthY;
            oz = op[2]; wz = currentEntity.widthZ;

            // Search events.
            for (let ei = lastEX, el = exAxis.length; ei < el; ++ei) {
                eventIndex = exAxis[ei];
                currentEvent = events[eventIndex];
                ep = currentEvent.position;
                ex = ep[0];
                range = currentEntity.range;

                // Cache for next entities.
                if (ox + maxWidth <= ex - maxRange) lastEX = ei;

                if (ox + wx < ex - range) continue; // Not yet.
                if (ox - wx > ex + range) break; // Too far.

                // Out of bounds.
                if (oy + wy < ep[1] - range) continue;
                if (oz + wy < ep[2] - range) continue;
                if (oy - wz > ep[1] + range) continue;
                if (oz - wz > ep[2] + range) continue;

                // Apply effect to entity.
                let a = currentEvent.effect.acceleration;
                if (a) {
                    const dx = ep[0] - op[0];
                    const dy = ep[1] - op[1];
                    const dz = ep[2] - op[2];
                    const rat = Math.sqrt(a / (dx * dx + dy * dy + dz * dz));
                    let a1 = currentEntity.a1;
                    a1[0] += rat * dx;
                    a1[1] += rat * dy;
                    a1[2] += rat * dz;
                }
            }
        }

        // Decrease event counters.
        eventOrderer.applyEventsInWorld(worldId);
    }

    /**
     * Integrates with leapfrog.
     */
    static processGlobalEvents(
        entities,
        world, worldId,
        relativeDt,
        oxAxis,
        leapfrogArray,
        passId,
        rigidBodiesSolver)
    {
        // let vS = [];
        // let aS = [];
        // const debug = false;

        const isCubeWorld = world.worldInfo.type === WorldType.CUBE;
        const maxSpeedInAir = Entity.maxSpeed;
        const maxSpeedInWater = Entity.maxSpeedInWater;

        for (let oi = 0, ol = oxAxis.length; oi < ol; ++oi)
        {
            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') continue;

            let entityIndex = oxAxis[oi].id;
            let currentEntity = entities[entityIndex];
            let p0 = currentEntity.p0; let p1 = currentEntity.p1;
            let v0 = currentEntity.v0; let v1 = currentEntity.v1;
            let a0 = currentEntity.a0; let a1 = currentEntity.a1;
            let nu = currentEntity.nu; // Instantaneous speed.
            let nu1 = currentEntity.nu1;

            let localTimeDilation = rigidBodiesSolver.getTimeDilation(worldId, p0[0], p0[1], p0[2]);
            // const dta = absoluteDt * localTimeDilation;
            const dtr = relativeDt * localTimeDilation;
            currentEntity.dtr = localTimeDilation; // dtr;

            const inWater = world.isWater(p0[0], p0[1], p0[2]);
            const maxSpeed = inWater ? maxSpeedInWater : maxSpeedInAir;
            // REAL PHYSICS, PART 1
            // Rules: the only non-gp physics entry point should be
            // acceleration. Speed might be accessed for lookup,
            // but should never be directly modified.
            // New positions are computed internally and cropped
            // should a collision occur with the terrain or another
            // entity (or x).

            let d = currentEntity.d; // Directions.
            let r = currentEntity.r; // Rotation.
            const maxV = currentEntity.getVelocity();
            const factor = Math.sqrt(maxV * 1.05);

            let g = RigidBodies.creativeMode ? [0, 0, 0] :
                rigidBodiesSolver.getGravity(world, worldId, p0[0], p0[1], p0[2]);
            // Only one non-zeno gravity component accepted on cube worlds.
            if (isCubeWorld && (g[0] !== 0) + (g[1] !== 0) + (g[2] !== 0) > 1)
            {
                g[0] = g[1] = g[2] = 0;
            }

            // let vector = RigidBodiesPhase1.getEntityForwardVector(d, r, factor, false); // 3D
            let vector = RigidBodiesPhase1.getEntityForwardVector(d, r, factor, true);
            let adh = currentEntity.adherence;

            // Compute the exact acceleration which is necessary
            // to get to the cap speed at the next iteration.

            // x_i+1 = x_i + v_i*T + (a_i/2)*T²
            let inc = [0, 0, 0, entityIndex];
            let sum = 0;
            for (let i = 0; i < 3; ++i) // Account for server congestion / lag with relative dilation.
            {
                nu1[i] = nu[i];
                let increment = v0[i] * dtr + .5 * a0[i] * dtr * dtr;
                inc[i] = increment;
                sum += increment * increment;
            }

            // Max speed correction.
            if (sum > maxSpeed * dtr)
                for (let i = 0; i < 3; ++i) inc[i] *= maxSpeed * dtr / sum;

            for (let i = 0; i < 3; ++i)
            {
                const vi = vector[i];
                nu[i] = vi;
                if (!inWater && (!adh[i] && g[i] < 0 || !adh[3 + i] && g[i] > 0)) {
                    // Cannot jump in air.
                    // Does not apply to gods because for them g = 0.
                    nu[i] = 0;
                }
                nu1[i] = nu[i];
                inc[i] += nu[i] * dtr;

                if (adh[i] && vi > 0.05 && g[i] < 0) {
                    console.log(`jump ${p1} -> ${p0}`);
                    // vi = .1;
                    a1[i] += 0.7;
                    inc[i] = 0;
                    adh[i] = false;
                }
                else if (adh[3 + i] && vi < -0.05 && g[i] > 0) {
                    console.log(`antijump ${passId}`);
                    // vi = -.1;
                    a1[i] -= 0.7;
                    inc[i] = 0;
                    adh[3 + i] = false;
                }
            }

            for (let i = 0; i < 3; ++i)
                p1[i] = p0[i] + inc[i];

            // Associate incremental term with entity index.
            leapfrogArray[oi] = [inc[0], inc[1], inc[2], oi];

            // Apply globals and inputs.
            // a_i+1 = sum(constraints)
            for (let i = 0; i < 3; ++i)
                a1[i] += g[i]; // N.B. f=ma => a=f/m => a=(P=mg)/m => a=g

            // Apply velocity formula with absolute time
            // (lag would undesirably change topologies).
            // v_i+1 = v_i< + T*(a_i + a_i+1)/2
            sum = 0;
            for (let i = 0; i < 3; ++i)
            {
                const v1i = v0[i] + dtr * .5 * (a0[i] + a1[i]);
                v1[i] = v1i;
                sum += v1i * v1i;
            }

            // Velocity correction.
            if (sum > maxSpeed * dtr)
                for (let i = 0; i < 3; ++i) v1[i] *= maxSpeed * dtr / sum;
            // console.log(p0);

            // if (debug) {
            //     vS.push(v1[2]);
            //     aS.push([a0[2], a1[2]]);
            // }
        }

        // if (debug && (vS.length > 1 && vS[0] !== vS[1])) {
        //     console.log(vS);
        //     console.log(aS);
        // }
    }

    static getForwardVector(d) {
        let fw = d[0] && !d[1]; let bw = !d[0] && d[1];
        let rg = d[2] && !d[3]; let lf = !d[2] && d[3];
        let up = d[4] && !d[5]; let dn = !d[4] && d[5];
        if (fw) return [1, 0, 0];
        if (bw) return [-1, 0, 0];
        if (rg) return [0, -1, 0];
        if (lf) return [0, 1, 0];
        if (up) return [0, 0, 1];
        if (dn) return [0, 0, -1];
        return [0, 0, 0];
    }

    // TODO use quaternions instead
    static getEntityForwardVector(d, rotation, factor, project2D)
    {
        let cos = Math.cos;
        let sin = Math.sin;
        let acos = Math.acos;
        let sgn = Math.sign;
        let sqrt = Math.sqrt;
        let square = x => x * x;
        const PI  = Math.PI;
        const PI2 = PI / 2;
        const PI4 = PI / 4;
        const PI34 = 3 * PI4;

        let relTheta0 = rotation[0]; let relTheta1 = rotation[1];
        let absTheta0 = rotation[2]; let absTheta1 = rotation[3];

        // d[0], d[1]: fw, bw
        // d[2], d[3]: rg, lf
        // d[4], d[5]: up, dn

        const fw = d[0] && !d[1]; const bw = !d[0] && d[1];
        const rg = d[2] && !d[3]; const lf = !d[2] && d[3];
        const up = d[4] && !d[5]; const dn = !d[4] && d[5];

        if (project2D) {
            relTheta1 = PI2;
            // I left a comment here saying this was wrong
            // but as I am dropping support for this project it will stay like this.
        }

        let nb0 = (fw || bw) + (rg || lf) + (up || dn);
        if (nb0 === 0) return [0, 0, 0];

        let getPsy1 = function(theta0, theta1, phi0, phi1) {
            const st0 = sin(theta0); const st1 = sin(theta1); const ct0 = cos(theta0);
            const ct1 = cos(theta1);
            const sp0 = sin(phi0); const sp1 = sin(phi1); const cp0 = cos(phi0);
            const cp1 = cos(phi1);
            return acos((ct1 + cp1) /
                sqrt(square(st1 * st0 + sp1 * sp0) + square(st1 * ct0 + sp1 * cp0) + square(ct1 + cp1))
            );
        };

        let getPsy0 = function(theta0, theta1, phi0, phi1) {
            const st0 = sin(theta0); let st1 = sin(theta1);
            const ct0 = cos(theta0);
            const sp0 = sin(phi0); let sp1 = sin(phi1);
            const cp0 = cos(phi0);

            const s = sgn(st1 * st0 + sp1 * sp0);
            return s *
                acos((st1 * ct0 + sp1 * cp0) /
                    sqrt(square(st1 * st0 + sp1 * sp0) + square(st1 * ct0 + sp1 * cp0))
                );
        };

        if (nb0 === 1)
        {
            if (fw); // {}
            else if (bw)  relTheta1 += PI;
            else if (up)  relTheta1 += PI2;
            else if (dn)  relTheta1 -= PI2;
            else if (rg) {relTheta0 -= PI2; relTheta1 = PI2;}
            else if (lf) {relTheta0 += PI2; relTheta1 = PI2;}
            else {
                console.log('[RigidBodies] Undefined direction (1).');
                return [0, 0, 0];
            }
        }
        else if (nb0 === 2)
        {
            const t0 = relTheta0;
            const t1 = relTheta1;

            switch (true)
            {
                case fw && up: relTheta1 += PI4; break;
                case fw && dn: relTheta1 -= PI4; break;
                case bw && up: relTheta1 += PI34; break;
                case bw && dn: relTheta1 -= PI34; break;

                case fw && rg:
                    // Faster.
                    // relTheta0 = relTheta0 - (PI2 - PI4*sin(relTheta1));
                    // relTheta1 = PI2 - PI4*cos(relTheta1);

                    // More accurate.
                    relTheta0 = getPsy0(t0, t1, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1, t0 - PI2, PI2) || 0;
                    break;
                case fw && lf:
                    relTheta0 = getPsy0(t0, t1, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1, t0 + PI2, PI2) || 0;
                    break;

                case bw && rg:
                    relTheta0 = getPsy0(t0, t1 + PI, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI, t0 - PI2, PI2) || 0;
                    break;

                case bw && lf:
                    relTheta0 = getPsy0(t0, t1 + PI, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI, t0 + PI2, PI2) || 0;
                    break;

                case rg && up:
                    relTheta0 = getPsy0(t0, t1 + PI2, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI2, t0 - PI2, PI2) || 0;
                    break;

                case rg && dn:
                    relTheta0 = getPsy0(t0, t1 - PI2, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 - PI2, t0 - PI2, PI2) || 0;
                    break;

                case lf && up:
                    relTheta0 = getPsy0(t0, t1 + PI2, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI2, t0 + PI2, PI2) || 0;
                    break;

                case lf && dn:
                    relTheta0 = getPsy0(t0, t1 - PI2, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 - PI2, t0 + PI2, PI2) || 0;
                    break;

                default:
                    console.log('[RigidBodies] Undefined direction (2).');
                    return [0, 0, 0];
            }
        }
        else if (nb0 === 3)
        {
            const t0 = relTheta0;
            const t1 = relTheta1;

            switch (true)
            {
                case fw && up && rg:
                    relTheta0 = getPsy0(t0, t1 + PI4, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI4, t0 - PI2, PI2) || 0;
                    break;
                case fw && dn && rg:
                    relTheta0 = getPsy0(t0, t1 - PI4, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 - PI4, t0 - PI2, PI2) || 0;
                    break;

                case fw && up && lf:
                    relTheta0 = getPsy0(t0, t1 + PI4, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI4, t0 + PI2, PI2) || 0;
                    break;
                case fw && dn && lf:
                    relTheta0 = getPsy0(t0, t1 - PI4, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 - PI4, t0 + PI2, PI2) || 0;
                    break;

                case bw && up && rg:
                    relTheta0 = getPsy0(t0, t1 + PI34, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI34, t0 - PI2, PI2) || 0;
                    break;
                case bw && dn && rg:
                    relTheta0 = getPsy0(t0, t1 - PI34, t0 - PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 - PI34, t0 - PI2, PI2) || 0;
                    break;

                case bw && up && lf:
                    relTheta0 = getPsy0(t0, t1 + PI34, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 + PI34, t0 + PI2, PI2) || 0;
                    break;
                case bw && dn && lf:
                    relTheta0 = getPsy0(t0, t1 - PI34, t0 + PI2, PI2) || 0;
                    relTheta1 = getPsy1(t0, t1 - PI34, t0 + PI2, PI2) || 0;
                    break;

                default:
                    console.log('[RigidBodies] Undefined direction (3).');
                    return [0, 0, 0];
            }
        }

        const cosAbs0 = cos(absTheta0); const cosRel0 = cos(relTheta0);
        const cosAbs1 = cos(absTheta1); const cosRel1 = cos(relTheta1);
        const sinAbs0 = sin(absTheta0); const sinRel0 = sin(relTheta0);
        const sinAbs1 = sin(absTheta1); const sinRel1 = sin(relTheta1);

        // let absUpVector =    [sinAbs1 * cosAbs0, sinAbs1 * sinAbs0, cosAbs1];
        // let absFrontVector = [cosAbs1 * cosAbs0, cosAbs1 * sinAbs0, -sinAbs1];
        // let relUpVector =    [sinRel1 * cosRel0, sinRel1 * sinRel0, cosRel1];
        // let relFrontVector = [- sinRel1 * sinRel0, sinRel1 * cosRel0, -cosRel1];

        let relFrontVector;

        // Rx(theta1) times Rz(theta0) times Forward [-sinRel1*sinRel0, sinRel1*cosRel0, -cosRel1]
        // N.B. Plane normal is Rx(theta1).Rz(theta0).(0,0,-1).
        // Rx(1)             Rz(0)
        // ( 1   0   0 )     ( c  -s   0 )     ( c0    -s0    0  )
        // ( 0   c  -s )  X  ( s   c   0 )  =  ( c1s0  c1c0  -s1 )
        // ( 0   s   c )     ( 0   0   1 )     ( s1s0  s1c0   c1 )
        // =>
        // ( c0(-S1S0) - s0(S1C0 )
        // ( c1c0(-S1S0) + c1c0(S1C0) + s1C1 )
        // ( s1s0(-S1S0) + s1c0(S1C0) - c1C1 )
        /*
        relFrontVector =    [
            (-sinRel1*sinRel0*cosAbs0         - sinRel1*cosRel0*sinAbs0                          ),
            (-sinRel1*sinRel0*cosAbs1*sinAbs0 + sinRel1*cosRel0*cosAbs1*cosAbs0 + cosRel1*sinAbs1),
            (-sinRel1*sinRel0*sinAbs1*sinAbs0 + sinRel1*cosRel0*sinAbs1*cosAbs0 - cosRel1*cosAbs1)
        ];
        */

        // Rz(theta0) times Rx(theta1) times Forward [-sinRel1*sinRel0, sinRel1*cosRel0, -cosRel1]
        // N.B. Plane normal is Rz(theta0).Rx(theta1).(0,0,-1).
        // Rz(0)             Rx(1)
        // ( c  -s   0 )     ( 1   0   0 )     ( c0   -s0c1   s0s1 )
        // ( s   c   0 )  X  ( 0   c  -s )  =  ( s0    c0c1  -c0s1 )
        // ( 0   0   1 )     ( 0   s   c )     ( 0     s1     c1   )
        // =>
        // ( c0(-S1S0) - s0c1(S1C0) - s0s1C1 )
        // ( s0(-S1S0) + c0c1(S1C0) - c0s1C1 )
        // ( s1(S1C0) - c1C1 )
        relFrontVector =    [
            -sinRel1 * sinRel0 * cosAbs0   -   sinRel1 * cosRel0 * sinAbs0 * cosAbs1   -   cosRel1 * sinAbs0 * sinAbs1,
            -sinRel1 * sinRel0 * sinAbs0   +   sinRel1 * cosRel0 * cosAbs0 * cosAbs1   +   cosRel1 * cosAbs0 * sinAbs1,
            /**/                               sinRel1 * cosRel0 * sinAbs1             -   cosRel1 * cosAbs1
        ];
        // The norm of this vector should be 1.

        let frontVector3D = [];

        for (let i = 0; i < 3; ++i) {
            frontVector3D[i] = relFrontVector[i] * factor;
        }

        return frontVector3D;
    }
}

export default RigidBodiesPhase1;
