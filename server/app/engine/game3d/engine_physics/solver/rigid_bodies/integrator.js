/**
 *
 */

'use strict';

import TerrainCollider from '../collision/terrain';
import XCollider from '../collision/x';

class Integrator {

    static isNull(vector3) {
        return vector3 === null || vector3[0] === 0 && vector3[1] === 0 && vector3[2] === 0;
    }

    static areEqual(vector3a, vector3b) {
        return vector3a[0] === vector3b[0] && vector3a[1] === vector3b[1] && vector3a[2] === vector3b[2];
    }

    // Returns true when an entity has updated.
    static updatePosition(orderer, dt, impulseSpeed, force, entity, em, wm, xm, world)
    {
        //console.log(entity.adherence);
        //console.log(entity.acceleration);
        let newPosition;

        if (Integrator.isNull(entity.acceleration)) {
            //console.log('Euler');
            newPosition = Integrator.integrateEuler(dt, impulseSpeed, force, entity, em, world);
            if (!newPosition) return false;

            let xCrossed = XCollider.xCollide(entity.position, newPosition, world, xm);
            if (xCrossed) {
                // TODO [CRIT] use the following
                // xCrossed.chunkId;
                // xCrossed.state;
                let newWorldId = xCrossed.worldId;

                orderer.switchEntityToWorld(entity, newWorldId, newPosition);
                // em.setWorldForEntity(entity, newWorldId);
            }

            // Update properties, phase 2.
            TerrainCollider.linearCollide(entity, world, entity.position, newPosition, dt);

            return true;
        }
        else {
            //console.log('Leapfrog');
            newPosition = Integrator.integrateLeapfrogPhase1(dt, impulseSpeed, force, entity, em, world);
            if (!newPosition) return false;

            let xCrossed = XCollider.xCollide(entity.position, newPosition, world, xm);
            if (xCrossed) {
                let newWorldId = xCrossed.worldId;
                //em.setWorldForEntity(entity, newWorldId);
                orderer.switchEntityToWorld(entity, newWorldId, newPosition);
            }

            // TODO [CRIT] UGLY, DESTROY IT. EXTERMINATE.
            let hasCollided = TerrainCollider.linearCollide(entity, world, entity.position, newPosition, dt);
            return Integrator.integrateLeapfrogPhase2(dt, impulseSpeed, force, entity, em, world, hasCollided);
        }
    }

    // First-order integrator
    // @returns {boolean} whether entity has updated
    static integrateEuler(dt, impulseSpeed, force, entity/*, EM, world*/) {
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
        for (let i = 0; i < 3; ++i) {
            if (newSpeed[i] < 0 && adherence[i] || newSpeed[i] > 0 && adherence[3 + i]) {
                newSpeed[i] = 0;
            }
        }

        // Update properties, phase 1
        entity.speed = newSpeed;
        entity._impulseSpeed = impulseSpeed;
        entity.acceleration = newAcceleration;

        // Detect movement
        if (newSpeed[0] === 0 && newSpeed[1] === 0 && newSpeed[2] === 0)
            return false;

        // Guess new position without constraints.
        let newPosition = [position[0], position[1], position[2]];
        for (let i = 0; i < 3; ++i) newPosition[i] += 0.1 * speed[i] * dt;

        // Notify an entity was updated.
        return newPosition;
    }

    // Higher order integrators induce heavier loads when solving in narrow phase.
    // More precisely, orders higher than 4 would need numerical solvers such as Newton-Raphson.

    // Second-order integrator (time-reversible, symplectic)
    // @returns {boolean} whether entity has updated
    //static integrateLeapfrog(dt, impulseSpeed, force, entity, EM, world) {
    static integrateLeapfrogPhase1(dt, impulseSpeed, force, entity/*, EM, world*/) {
        let position = entity.position;
        let speed = entity.speed;
        let acceleration = entity.acceleration;

        //let previousImpulseSpeed = entity._impulseSpeed;
        //if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
        //    for (let i = 0; i < 3; ++i) speed[i] = speed[i] + impulseSpeed[i] - previousImpulseSpeed[i];
        //}

        // Guess new position without constraints.
        let newPosition = [position[0], position[1], position[2]];
        for (let i = 0; i < 3; ++i) newPosition[i] += 0.1 * dt * (speed[i] + acceleration[i] * dt * 0.5);

        // Detect change in position.
        if (Integrator.areEqual(newPosition, position))
            return false;

        return newPosition;
    }

    static integrateLeapfrogPhase2(dt, impulseSpeed, force, entity, EM, world, hasCollided) {
        if (hasCollided) {
            // entity.speed = determined by the collider
            // entity.acceleration[2] = -0.11;
            //let newAcceleration = [0, 0, 0];
            //if (mass > 0) for (let i = 0; i < 3; ++i) newAcceleration[i] = force[i] / mass;
            //entity.acceleration = newAcceleration;
            entity.speed[0] = entity._impulseSpeed[0];
            entity.speed[1] = entity._impulseSpeed[1];
        }
        else {
            let mass = entity.mass;
            let speed = entity.speed;
            let acceleration = entity.acceleration;

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
            for (let i = 0; i < 3; ++i) newSpeed[i] += dt * (newAcceleration[i] + acceleration[i]) / 2; // Leapfrog

            // Update properties
            entity.speed = newSpeed;
            entity.acceleration = newAcceleration;
        }

        entity._impulseSpeed = impulseSpeed;

        // Notify an entity was updated.
        return true;
    }

    // TODO [MEDIUM] Verlet integrator

}

export default Integrator;
