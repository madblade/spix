/**
 *
 */

'use strict';

class Newton {

    static solve(EM, WM, Δt) {
        EM.forEach(function(entity) {
            Newton.linearSolve(entity, EM, WM, Δt);
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

    // Or:
    // Sum fields.
    // Add terrain as field
    // Add player contribution
    // retest terrain as limit

    static linearSolve(entity, EM, WM, Δt) {
        const theta = entity.rotation[0];
        const ds = entity.directions;
        const pos = entity.position;

        const desiredSpeed = Newton.computeDesiredSpeed(theta, ds, Δt);

        Newton.updatePosition(ds, pos, desiredSpeed, entity, EM, WM, false);
    }

    static quadraticSolve(entity, EM, WM, Δt) {
        const theta = entity.rotation[0];
        const ds = entity.directions;
        const pos = entity.position;

        const desiredSpeed = Newton.computeDesiredSpeed(theta, ds, Δt);

        Newton.updatePosition(ds, pos, desiredSpeed, entity, EM, WM, true);
    }

    static updatePosition(ds, pos, desiredSpeed, entity, EM, WM, quadratic) {
        if ((ds[0] !== ds[3]) || (ds[1] !== ds[2]) || ds[4] !== ds[5]) {
            // Compute new position.
            let newPosition = [pos[0], pos[1], pos[2]];
            for (let i = 0; i < 3; ++i) newPosition[i] += 0.1 * desiredSpeed[i];

            if (quadratic) {
                // Collide world.
                if (!WM.isEmpty(newPosition)) return;
                // Collide entities.
                // TODO 2 passes-solve
            }

            // Update.
            entity.position = newPosition;

            // Notify an entity was updated.
            EM.entityUpdated(entity.id);
        }
    }

    static computeDesiredSpeed(theta, ds, Δt) {
        var desiredSpeed = [0, 0, (ds[4]&&!ds[5])?1:(ds[5]&&!ds[4])?-1:0];
        const pi4 = Math.PI/4;

        if (ds[0] && !ds[3]) // forward quarter
        {
            let theta2 = theta;
            if (ds[1] && !ds[2]) theta2 -= pi4; // right
            else if (ds[2] && !ds[1]) theta2 += pi4; // left
            desiredSpeed[0] = -Math.sin(theta2);
            desiredSpeed[1] = Math.cos(theta2);
        }
        else if (ds[3] && !ds[0]) // backward quarter
        {
            let theta2 = theta;
            if (ds[1] && !ds[2]) theta2 += pi4; // right
            else if (ds[2] && !ds[1]) theta2 -= pi4; // left
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

        const dt = Δt/20000000;
        desiredSpeed[0] *= dt;
        desiredSpeed[1] *= dt;
        desiredSpeed[2] *= dt;

        return desiredSpeed;
    }

}

export default Newton;
