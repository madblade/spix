/**
 *
 */

'use strict';

import Integrator from './integrator';
import Orderer from './orderer';

class RigidBodies {

    constructor() {
        
        // 
        this._gravity = [0, 0, -0.11];
        this._globalTimeDilatation = 20000000;
        
        //
        
        
    }

    get gravity() { return this._gravity; }
    set gravity(g) { this._gravity = g; }
    get globalTimeDilatation() { return this._globalTimeDilatation; }
    
    solve(orderer, em, wm, xm, o, Δt) {
        
        let dt = Δt / this.globalTimeDilatation;
        if (dt > 5.0) {
            dt = 5.0;
        }
        
        // Decouple entities from worlds.
        // A given entity can span across multiple worlds.
        let entities = em.entities;
        let axes = orderer.axes;
        
        // TODO [CRIT] remove temporary lookup copy
        let aaxs = new Map();
        axes.forEach((axis, worldId) => {
            var xs = [], ys = [], zs = [];
            axis[0].forEach(a => xs.push({id:a.id}));
            axis[1].forEach(a => ys.push({id:a.id}));
            axis[2].forEach(a => zs.push({id:a.id}));
            aaxs.set(worldId, [xs, ys, zs]);
        });
        
        aaxs.forEach((axis, worldId) => {
            // TODO [CRIT] use more cache-friendly arrays.
            let world = wm.getWorld(worldId);
            let xAxis = axis[0];
            console.log(worldId + ' : ' + xAxis.length);
            
            for (let i = 0, l = xAxis.length; i < l; ++i) {
                let entity = entities[xAxis[i].id];
                if (!entity) throw Error('[Physics/Rigid bodies]: ' +
                    'processing undefined entities, abort.');
                
                let entityId = entity.entityId;
            
                // 1. Sum inertia, inputs/impulses, fields.
                     
                // 2. Compute (x_i+1, a_i+1, v_i+1), order Leapfrog's incremental term.
                //    Computation takes into account local time dilatation.
            
                // 3. Snap x_i+1 with terrain collide, save non-integrated residuals.
                const entityUpdated = this.linearSolve(orderer, entity, em, wm, xm, world, dt);
                
                // 4. Compute islands, cross world.
            
                // 5. Broad phase: in every island, recurse from highest to lowest leapfrog's term
                //    check neighbours for min distance in linearized trajectory
                //    detect and push PROBABLY COLLIDING PAIRS.
            
                // 6. Narrow phase, part 1: for all probably colliding pairs,
                //    solve X² leapfrog, save first all valid Ts
                //    keep list of ordered Ts across pairs.
            
                // 7. Narrow phase, part 2: for all Ts in order,
                //    set bodies as in contact or terminal (terrain), 
                //    compute new paths (which are not more than common two previous) while compensating forces 
                //    so as to project the result into directions that are not occluded
                //      -> bouncing will be done in next iteration to ensure convergence
                //      -> possible to keep track of the energy as unsatisfied work of forces
                //    solve X² leapfrog for impacted trajectories and insert new Ts in the list (map?)      
                //    End when there is no more collision to be solved.
            
                // 7. Apply new positions, correct (v_i+1, a_i+1) and resulting constraints,
                //    smoothly slice along constrained boundaries until component is extinct.
            
                // 8. Perform updates in optimization structures.
                //    Perform updates in consistency maps.
                if (entityUpdated) {
                    o.entityUpdated(entityId);
                }
            
            }
            
        });
        
    }

    linearSolve(orderer, entity, em, wm, xm, world, dt) {
        if (!entity || !entity.rotation) return;

        const theta = entity.rotation[0];
        const ds = entity.directions;
        const pos = entity.position;

        var impulseSpeed = [0, 0, 0];
        var force = [0, 0, 0];

        this.computeDesiredSpeed(entity, impulseSpeed, theta, ds, dt);

        this.sumGlobalFields(force, pos, entity);

        // RigidBodies.sumLocalFields(force, pos, EM);

        var hasUpdated = Integrator.updatePosition(orderer, dt, impulseSpeed, force, entity, em, wm, xm, world);

        return hasUpdated;
    }

    quadraticSolve(entity, em, wm, xm, world, dt) {
        const theta = entity.rotation[0];
        const ds = entity.directions;
        const pos = entity.position;

        var impulseSpeed = [0, 0, 0];
        var force = [0, 0, 0];
        var hasUpdated = false;

        this.computeDesiredSpeed(entity, impulseSpeed, theta, ds, dt);

        this.sumGlobalFields(force, pos, entity);

        this.sumLocalFields(force, pos, em);

        // TODO [HIGH] manage collisions

        hasUpdated = Integrator.updatePosition(dt, impulseSpeed, force, entity, em, world, xm);

        return hasUpdated;
    }

    static add(result, toAdd) {
        result[0] += toAdd[0];
        result[1] += toAdd[1];
        result[2] += toAdd[2];
    }

    computeDesiredSpeed(entity, speed, theta, ds, dt) {
        var desiredSpeed = [0, 0, 0];
        const gravity = this.gravity;
        const pi4 = Math.PI/4;

        if (ds[0] && !ds[3]) // forward quarter
        {
            let theta2 = theta;
            if (ds[1] && !ds[2]) // right
                theta2 -= pi4;
            else if (ds[2] && !ds[1]) // left
                theta2 += pi4;
            desiredSpeed[0] = -Math.sin(theta2);
            desiredSpeed[1] = Math.cos(theta2);
        }
        else if (ds[3] && !ds[0]) // backward quarter
        {
            let theta2 = theta;
            if (ds[1] && !ds[2]) // right
                theta2 += pi4;
            else if (ds[2] && !ds[1]) // left
                theta2 -= pi4;
            desiredSpeed[0] = Math.sin(theta2);
            desiredSpeed[1] = -Math.cos(theta2);

        }
        else if (ds[1] && !ds[2]) // exact right
        {
            desiredSpeed[0] = Math.cos(theta);
            desiredSpeed[1] = Math.sin(theta);

        }
        else if (ds[2] && !ds[1]) // exact left
        {
            desiredSpeed[0] = -Math.cos(theta);
            desiredSpeed[1] = -Math.sin(theta);
        }

        let godMode = false;
        if (godMode) {
            desiredSpeed[2] = (ds[4]&&!ds[5])?1:(ds[5]&&!ds[4])?-1:0;
        } else {
            if (ds[4]&&!ds[5]) {
                for (let i = 0; i<3; ++i) {
                    if (gravity[i] < 0 && entity.adherence[i]) {
                        entity.acceleration[i] = 3.3/dt;
                        entity.jump(i); // In which direction I jump
                    }
                }
                for (let i = 3; i<6; ++i) {
                    if (gravity[i-3] > 0 && entity.adherence[i]) {
                        entity.acceleration[i-3] = -3.3/dt;
                        entity.jump(i); // In which direction I jump
                    }
                }
            }
        }

        desiredSpeed[0] *= 0.65;
        desiredSpeed[1] *= 0.65;
        desiredSpeed[2] *= 0.65;

        RigidBodies.add(speed, desiredSpeed);
    }

    sumGlobalFields(force, pos, entity) {
        // Gravity
        let g = this.gravity;
        let m = entity.mass;
        var sum = [g[0]*m, g[1]*m, g[2]*m];

        // sum[2] = 0; // ignore grav

        RigidBodies.add(force, sum);
    }

    sumLocalFields(force, pos, EM) {
        var sum = [0, 0, 0];
        RigidBodies.add(force, sum);
    }

}

export default RigidBodies;
