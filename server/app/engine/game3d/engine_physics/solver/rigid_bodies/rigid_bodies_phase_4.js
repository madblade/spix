/**
 * Integration.
 */

import TerrainCollider from '../collision/terrain';
import Phase3 from './rigid_bodies_phase_3';

class RigidBodiesPhase4
{
    static solve(dr, v, nu, a, dtr)
    {
        let deltaT = dr * dtr;
        let vec = [0, 0, 0];
        for (let k = 0; k < 3; ++k)
            vec[k] = (v[k] + nu[k]) * deltaT + .5 * a[k] * deltaT * deltaT;
        return vec;
    }

    static minimize(delta, p0, p1, a)
    {
        if (p0[a] < p1[a] && p0[a] + delta[a] >= p1[a] ||
            p0[a] > p1[a] && p0[a] + delta[a] <= p1[a])
            delta[a] = p1[a] - p0[a];
    }

    static solveIslandStepLinear(
        mapCollidingPossible,
        i, // island 1 index
        j, // island 2 index
        r, // time got by solver
        axis, // 'x', 'y', 'z' or 'none'
        subIslandI, subIslandJ,
        entities,
        objectIndexInIslandToSubIslandXIndex,
        objectIndexInIslandToSubIslandYIndex,
        objectIndexInIslandToSubIslandZIndex,
        oxAxis, island, world, relativeDt)
    {
        mapCollidingPossible.shift();

        if (!subIslandI || subIslandI.length === 0) subIslandI = [i];
        if (!subIslandJ || subIslandJ.length === 0) subIslandJ = [j];

        // Get axis.
        const ax = axis === 'x' ? 0 : axis === 'y' ? 1 : axis === 'z' ? 2 : -1;
        if (ax < 0)
        {
            console.error('[Phase IV] [BAD] invalid axis.');
            return;
        }

        // Compute island properties.
        let sub1Mass = 0;
        let sub2Mass = 0;
        let newMass;
        let newVel = [0, 0, 0];
        let newAcc = [0, 0, 0];

        // Sum mass.
        for (let idInSub1 = 0, sub1Length = subIslandI.length; idInSub1 < sub1Length; ++idInSub1)
            sub1Mass += entities[oxAxis[island[subIslandI[idInSub1]]].id].mass;
        for (let idInSub2 = 0, sub2Length = subIslandJ.length; idInSub2 < sub2Length; ++idInSub2)
            sub2Mass += entities[oxAxis[island[subIslandJ[idInSub2]]].id].mass;
        newMass = sub1Mass + sub2Mass;

        // Compute uniform speed.
        {
            let e1 = entities[oxAxis[island[subIslandI[0]]].id];
            let vel1 = e1.v0;
            let acc1 = e1.a0;

            let e2 = entities[oxAxis[island[subIslandJ[0]]].id];
            let vel2 = e2.v0;
            let acc2 = e2.a0;

            for (let t = 0; t < 3; ++t)
            {
                newVel[t] = (sub1Mass * vel1[t] + sub2Mass * vel2[t]) / newMass;
                newAcc[t] = (sub1Mass * acc1[t] + sub2Mass * acc2[t]) / newMass;
            }
        }

        let abs = Math.abs;

        // Concat indexes form both islands into newSubIsland
        let newSubIsland = Array.from(subIslandI).concat(subIslandJ);

        // 2. compute new p1 (projected)
        // (force sum > integration)
        // For time dilation => take the smallest delta t.
        //
        // (*) compute v_newIsland and a_newIsland (add).
        // (*) then, v0(entity) = v_newIsland and a0(entity) = a_newIsland
        // dtr(entity) = (t1-t) \times min(ldt)
        //
        // (*) finally, p1(entity) = p0(entity) + solve(t1-r, v_newIsland, a_newIsland).
        // for all elements of the new island
        let correctionDelta = 0;
        let entityIdsInIslandWhichNeedTerrainPostSolving = [];
        for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
        {
            let entityIdInIsland = newSubIsland[idInNewSub];
            if (entityIdInIsland === i || entityIdInIsland === j) continue;

            let entityId = oxAxis[island[entityIdInIsland]].id;
            let currentEntity = entities[entityId];

            let nu = currentEntity.nu;
            let v0 = currentEntity.v0;
            let a0 = currentEntity.a0;
            for (let k = 0; k < 3; ++k) {
                v0[k] = newVel[k];
                a0[k] = newAcc[k];
            }

            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;

            // let lastR = currentEntity.lastR;
            let deltaR = r; // lastR > 0 ? relativeDt - lastR : relativeDt;
            if (deltaR === 0)
            {
                continue;
            }

            const dtr = currentEntity.dtr; // Should be extracted from time dilation field instead
            let newP1 = RigidBodiesPhase4.solve(deltaR, v0, nu, a0, dtr);

            let hasCollided = TerrainCollider.collideLinear(currentEntity, world, p0, p1, true);
            if (hasCollided) {
                let currentDelta = p1[ax] - newP1[ax];
                if (abs(currentDelta) > abs(correctionDelta)) correctionDelta = currentDelta;
                // For later recorrection
                // for (let k = 0; k < 3; ++k) p1[k] = newP1Test[k];

                entityIdsInIslandWhichNeedTerrainPostSolving.push(entityIdInIsland);
                console.log(`\t[Phase IV] Entity ${currentEntity.entityId} needs resolving ` +
                    'within its island because of a fixed terrain collision.');
            }

            currentEntity.lastR = r;
        }
        // Collision correction.
        // for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
        // {
        //     let entityIdInIsland = newSubIsland[idInNewSub];
        //     if (entityIdInIsland === i || entityIdInIsland === j) continue;
        //     let entityId = oxAxis[island[entityIdInIsland]].id;
        //     let currentEntity = entities[entityId];
        //     let p1 = currentEntity.p1;
        //     p1[ax] += correctionDelta;
        // }

        // (*) remove every member of newIsland from mapCollidingPossible
        // 2.1. remove the collision couple from the collidingPossible map
        // 4. invalidate collisions betwixt the current entity and other entities (not in the same sub-island).
        // Outdated
        // 4.1. shift collisions for all other entities (r)
        // integrate the quadratic solution delta
        let mcpSize = mapCollidingPossible.length;
        for (let k = mcpSize - 1; k >= 0; --k)
        {
            let current = mapCollidingPossible[k];
            let island1Index = current[0];
            let island2Index = current[1];
            let currentAxis = current[3];

            let subIslandIndex1;
            let subIslandIndex2;
            switch (currentAxis) {
                case 'x':
                    subIslandIndex1 = objectIndexInIslandToSubIslandXIndex[island1Index];
                    subIslandIndex2 = objectIndexInIslandToSubIslandXIndex[island2Index];
                    break;
                case 'y':
                    subIslandIndex1 = objectIndexInIslandToSubIslandYIndex[island1Index];
                    subIslandIndex2 = objectIndexInIslandToSubIslandYIndex[island2Index];
                    break;
                case 'z':
                    subIslandIndex1 = objectIndexInIslandToSubIslandZIndex[island1Index];
                    subIslandIndex2 = objectIndexInIslandToSubIslandZIndex[island2Index];
                    break;
                default: console.error('\t[RBP4] Invalid axis entry in map colliding possible.');
            }

            let currentIsInvalid = false;
            for (let idInSub1 = 0, subLength = subIslandI.length; idInSub1 < subLength; ++idInSub1)
            {
                let entityIdInSubIslands = subIslandI[idInSub1];
                if (subIslandIndex1 === entityIdInSubIslands || subIslandIndex2 === entityIdInSubIslands)
                // check if currentAxis === axis?
                {
                    mapCollidingPossible.splice(k, 1);
                    currentIsInvalid = true;
                    break;
                }
            }

            if (!currentIsInvalid)
                for (let idInSub2 = 0, subLength = subIslandJ.length; idInSub2 < subLength; ++idInSub2)
                {
                    let entityIdInSubIslands = subIslandJ[idInSub2];
                    if (subIslandIndex1 === entityIdInSubIslands || subIslandIndex2 === entityIdInSubIslands)
                    // check if currentAxis === axis?
                    {
                        mapCollidingPossible.splice(k, 1);
                        break;
                    }
                }
        }

        // 3. solve from p0 to p1 (terrain + x)
        // (for all entities in newSubIsland) <- Approximation (explicit solving)

        // 5. solve from p0 to p1' (for all entities in the island but not in the sub-island)
        //
        // (*) apply leapfrog on:
        // (NewIsland \cross Complementaire(NewIsland)) \union
        // (TerrainK(NewIsland) \cross Complementaire(TerrainK(NewIsland)) \intersect NewIsland)
        let mapCollidingPossibleNew = [];

        let debug = false;
        if (debug)
        {
            console.log(`\t\tProcessing post-collision: 
                ${entities[oxAxis[island[subIslandI[0]]].id].entityId} 
                [${subIslandI}] vs ${entities[oxAxis[island[subIslandJ[0]]].id].entityId} 
                [${subIslandJ}] || [${newSubIsland}]`);
        }

        Phase3.solveLeapfrogPostCollision(
            island,
            newSubIsland,
            entityIdsInIslandWhichNeedTerrainPostSolving,
            oxAxis, entities, relativeDt, mapCollidingPossibleNew);

        // append the result with r unchanged in mapCollidingPossible
        for (let k = 0, l = mapCollidingPossibleNew.length; k < l; ++k)
        {
            mapCollidingPossible.push(mapCollidingPossibleNew[k]);
        }

        mapCollidingPossible.sort((a, b) => a[2] - b[2]);
    }
    // 6. loop back
}

export default RigidBodiesPhase4;
