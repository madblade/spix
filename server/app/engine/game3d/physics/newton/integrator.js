/**
 *
 */

'use strict';

import TerrainCollider from '../collision/terrain';

class Integrator {

    static isNull(vector3) {
        return vector3 === null || vector3[0] === 0 && vector3[1] === 0 && vector3[2] === 0;
    }

    static areEqual(vector3a, vector3b) {
        return vector3a[0] === vector3b[0] && vector3a[1] === vector3b[1] && vector3a[2] === vector3b[2];
    }

    static updatePosition(dt, impulseSpeed, force, entity, EM, WM) {
        if (Integrator.isNull(entity.acceleration)) {
            //console.log('Euler');
            Integrator.integrateEuler(dt, impulseSpeed, force, entity, EM, WM);
        } else {
            //console.log('Leapfrog');
            Integrator.integrateLeapfrog(dt, impulseSpeed, force, entity, EM, WM);
        }
    }

    // First-order integrator
    static integrateEuler(dt, impulseSpeed, force, entity, EM, WM) {
        let mass = entity.mass;

        let position = entity.position;
        let speed = entity.speed;

        // Update acceleration
        let newAcceleration = [0, 0, 0];
        if (mass > 0) {
            for (let i = 0; i < 3; ++i) newAcceleration[i] = force[i] / mass;
        }

        // Update speed
        let newSpeed = [speed[0], speed[1], speed[2]];
        let previousImpulseSpeed = entity._impulseSpeed;
        if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
            for (let i = 0; i < 3; ++i) newSpeed[i] = newSpeed[i] + impulseSpeed[i] - previousImpulseSpeed[i];
        }
        for (let i = 0; i < 3; ++i) newSpeed[i] += dt * newAcceleration[i];

        // Filter, adherence
        let adherence = entity.adherence;
        for (let i = 0; i<3; ++i) {
            if (newSpeed[i] < 0 && adherence[i] || newSpeed[i] > 0 && adherence[3+i]) {
                newSpeed[i] = 0;
            }
        }

        // Update properties, phase 1
        entity.speed = newSpeed;
        entity._impulseSpeed = impulseSpeed;
        entity.acceleration = newAcceleration;

        // Detect movement
        if (newSpeed[0] === 0 && newSpeed[1] === 0 && newSpeed[2] === 0) return;

        // Guess new position without constraints.
        let newPosition = [position[0], position[1], position[2]];
        for (let i = 0; i < 3; ++i) newPosition[i] += 0.1 * speed[i] * dt;

        // Update properties, phase 2.
        TerrainCollider.linearCollide(entity, WM, position, newPosition, dt);

        // Notify an entity was updated.
        EM.entityUpdated(entity.id);
    }

    // Second-order integrator (time-reversible, symplectic)
    static integrateLeapfrog(dt, impulseSpeed, force, entity, EM, WM) {
        let mass = entity.mass;

        let position = entity.position;
        let speed = entity.speed;
        let acceleration = entity.acceleration;

        //let previousImpulseSpeed = entity._impulseSpeed;
        //if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
        //    for (let i = 0; i < 3; ++i) speed[i] = speed[i] + impulseSpeed[i] - previousImpulseSpeed[i];
        //}

        // Guess new position without constraints.
        let newPosition = [position[0], position[1], position[2]];
        for (let i = 0; i < 3; ++i) newPosition[i] += 0.1 * dt * (speed[i]+acceleration[i]*dt*0.5);

        // Detect change in position.
        if (Integrator.areEqual(newPosition, position)) return;

        if (TerrainCollider.linearCollide(entity, WM, position, newPosition, dt)) {
            // entity.speed = determined by the collider
            // entity.acceleration[2] = -0.11;
            //let newAcceleration = [0, 0, 0];
            //if (mass > 0) for (let i = 0; i < 3; ++i) newAcceleration[i] = force[i] / mass;
            //entity.acceleration = newAcceleration;
            entity.speed[0] = entity._impulseSpeed[0];
            entity.speed[1] = entity._impulseSpeed[1];

        } else {

            // Update acceleration
            let newAcceleration = [0, 0, 0];
            if (mass > 0) {
                for (let i = 0; i < 3; ++i) newAcceleration[i] = force[i] / mass;
            }

            // Update speed
            let newSpeed = [speed[0], speed[1], speed[2]];
            let previousImpulseSpeed = entity._impulseSpeed;
            if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
                for (let i = 0; i < 3; ++i) newSpeed[i] = newSpeed[i] + impulseSpeed[i] - previousImpulseSpeed[i];
            }
            for (let i = 0; i < 3; ++i) newSpeed[i] += dt * (newAcceleration[i]+acceleration[i])/2; // Leapfrog

            // Update properties
            entity.speed = newSpeed;
            entity.acceleration = newAcceleration;
        }

        entity._impulseSpeed = impulseSpeed;

        // Notify an entity was updated.
        EM.entityUpdated(entity.id);
    }

}

export default Integrator;
