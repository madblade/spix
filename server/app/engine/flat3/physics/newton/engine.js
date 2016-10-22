/**
 *
 */

'use strict';

import Integrator from './integrator';

class Newton {

    static globalTimeDilatation = 20000000;

    static solve(EM, WM, Δt) {

        const dt = Δt/Newton.globalTimeDilatation;

        EM.forEach(function(entity) {
            Newton.linearSolve(entity, EM, WM, dt);
        });

        // Get entities inputs
        // Compute forces on global fields
        // Compute forces on local fields

        // Solve movements
        // Compute entity collisions
        // Compute terrain collisions
        // Solve again

        // Update positions

        // Effects
        // Reverse time...

        // Future...
        // Update orientations
        // Manage fragmentation
    }

    static linearSolve(entity, EM, WM, dt) {
        const theta = entity.rotation[0];
        const ds = entity.directions;
        const pos = entity.position;

        var impulseSpeed = [0, 0, 0];
        var force = [0, 0, 0];

        Newton.computeDesiredSpeed(entity, impulseSpeed, theta, ds, dt);

        Newton.sumGlobalFields(force, pos, entity);

        // Newton.sumLocalFields(force, pos, EM);

        Integrator.updatePosition(dt, impulseSpeed, force, entity, EM, WM);
    }

    static quadraticSolve(entity, EM, WM, dt) {
        const theta = entity.rotation[0];
        const ds = entity.directions;
        const pos = entity.position;

        var impulseSpeed = [0, 0, 0];
        var force = [0, 0, 0];

        Newton.computeDesiredSpeed(entity, impulseSpeed, theta, ds, dt);

        Newton.sumGlobalFields(force, pos, entity);

        Newton.sumLocalFields(force, pos, EM);

        // TODO manage collisions

        Integrator.updatePosition(dt, impulseSpeed, force, entity, EM, WM);
    }

    static add(result, toAdd) {
        result[0]+=toAdd[0];
        result[1]+=toAdd[1];
        result[2]+=toAdd[2];
    }

    static computeDesiredSpeed(entity, speed, theta, ds, dt) {
        var desiredSpeed = [0, 0, 0];
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

        desiredSpeed[0] *= 0.65;
        desiredSpeed[1] *= 0.65;
        if (entity.onGround() && (ds[4]&&!ds[5])) {
            //desiredSpeed[2] = 2;
            entity.acceleration[2] = 3.3/dt;
            entity.jump();
        } else {
            // desiredSpeed[2] = (ds[4]&&!ds[5])?1:(ds[5]&&!ds[4])?-1:0;
        }

        Newton.add(speed, desiredSpeed);
    }

    static sumGlobalFields(force, pos, entity) {
        // Gravity
        var sum = [0, 0, -0.11*entity.mass];

        //sum[2] = 0; // ignore grav

        Newton.add(force, sum);
    }

    static sumLocalFields(force, pos, EM) {
        var sum = [0, 0, 0];
        Newton.add(force, sum);
    }

}

export default Newton;
