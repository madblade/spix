/**
 * Integration.
 */

import TerrainCollider from '../collision/terrain';
import Phase3 from './rigid_bodies_phase_3';

class RigidBodiesPhase4
{
    static solveIslandStepLinear(
        mapCollidingPossible,
        i, // island 1 index
        j, // island 2 index
        r, // time got by solver
        axis, // 'x', 'y', 'z' or 'none'
        subIslandI, subIslandJ, // newSubIsland, // Beware! NewSubIsland is empty.
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
        let ax;
        switch (axis) {
            case 'x': ax = 0; break;
            case 'y': ax = 1; break;
            case 'z': ax = 2; break;
            default : console.log('[Phase IV] [BAD] invalid axis.'); break;
        }

        // Compute island properties.
        let sub1Mass = 0;
        let sub2Mass = 0;
        let newMass;
        let sub1Vel = [0, 0, 0];
        let sub2Vel = [0, 0, 0];
        let sub1Acc = [0, 0, 0];
        let sub2Acc = [0, 0, 0];
        let newVel = [0, 0, 0];
        let newAcc = [0, 0, 0];
        let deltaP1 = [0, 0, 0];
        let deltaP2 = [0, 0, 0];

        // Sum mass.
        // {
        for (let idInSub1 = 0, sub1Length = subIslandI.length; idInSub1 < sub1Length; ++idInSub1)
            sub1Mass += entities[oxAxis[island[subIslandI[idInSub1]]].id].mass;
        for (let idInSub2 = 0, sub2Length = subIslandJ.length; idInSub2 < sub2Length; ++idInSub2)
            sub2Mass += entities[oxAxis[island[subIslandJ[idInSub2]]].id].mass;
        // }
        newMass = sub1Mass + sub2Mass;

        // Compute uniform speed.
        {
            let e1 = entities[oxAxis[island[subIslandI[0]]].id];
            let vel1 = e1.v0;
            let acc1 = e1.a0;
            // let nu1 = e1.nu;
            for (let t = 0; t < 3; ++t)
            {
                sub1Vel[t] = vel1[t];
                sub1Acc[t] = acc1[t];
            }
            deltaP1[ax] = e1.p1[ax] - e1.p0[ax];

            let e2 = entities[oxAxis[island[subIslandJ[0]]].id];
            let vel2 = e2.v0;
            let acc2 = e2.a0;
            // let nu2 = e2.nu;
            for (let t = 0; t < 3; ++t)
            {
                sub2Vel[t] = vel2[t];
                sub2Acc[t] = acc2[t];
            }
            deltaP2[ax] = e2.p1[ax] - e2.p0[ax];

            for (let t = 0; t < 3; ++t)
            {
                newVel[t] = (sub1Mass * sub1Vel[t] + sub2Mass * sub2Vel[t]) / newMass;
                newAcc[t] = (sub1Mass * sub1Acc[t] + sub2Mass * sub2Acc[t]) / newMass;
            }
        }

        // 1. collision -> mettre p0 à p1 (t_collision)
        // (pour toute entité appartenant à newSubIsland) <- Approximation (explicit solving)
        //
        // (*) à t0 + r, toutes les entités dans island1 + island2
        // sont mises à p0(entité) = p0(entité) + solve(r-r_last(entité), v_entité, a_entité, dtr(entité)).
        let solve = function(dr, v, nu, a, dtr) {
            let deltaT = dr * dtr;
            let vec = [0, 0, 0];
            for (let k = 0; k < 3; ++k)
                vec[k] = (v[k] + nu[k]) * deltaT + .5 * a[k] * deltaT * deltaT;
            return vec;
        };
        // let add = function(vec1, vec2) {
        //     for (let k = 0; k < 3; ++k) vec1[k] += vec2[k];
        // };
        let copy = function(vec) {
            return [...vec];
        };
        // let sum = function(vec1, vec2) {
        //     let vec3 = [0, 0, 0];
        //     for (let k = 0; k < 3; ++k) vec3[k] = vec1[k] + vec2[k];
            // vec3[a] = vec1[a] + vec2[a];
            // return vec3;
        // };
        let minimize = function(delta, p0, p1, a) {
            // for (let k = 0; k < 3; ++k)
            //     if (abs(delta[k]) < abs(p1[k] - p0[k])) delta[k] = p1[k] - p0[k];
            if (p0[a] < p1[a] && p0[a] + delta[a] >= p1[a] ||
                p0[a] > p1[a] && p0[a] + delta[a] <= p1[a])
                delta[a] = p1[a] - p0[a];
            // if (abs(delta[a]) < abs(p1[a] - p0[a])) delta[a] = p1[a] - p0[a];
        };
        let abs = Math.abs;

        // Get max dtr.
        let maxDtr1 = 1;
        let maxDtr2 = 1;
        for (let idSub1 = 0, subLength = subIslandI.length; idSub1 < subLength; ++idSub1)
        {
            let entityIdInSubIslands = subIslandI[idSub1];
            let entityId = oxAxis[island[entityIdInSubIslands]].id;
            let currentEntity = entities[entityId];
            let currentDtr = currentEntity.dtr;
            if (currentDtr > maxDtr1) maxDtr1 = currentDtr;
        }

        for (let idSub2 = 0, newSubLength = subIslandJ.length; idSub2 < newSubLength; ++idSub2)
        {
            let entityIdInSubIslands = subIslandJ[idSub2];
            let entityId = oxAxis[island[entityIdInSubIslands]].id;
            let currentEntity = entities[entityId];
            let currentDtr = currentEntity.dtr;
            if (currentDtr > maxDtr2) maxDtr2 = currentDtr;
        }

        // let reapply1 = false;
        let newDelta1 = [...deltaP1];
        for (let idInSub1 = 0, subLength = subIslandI.length; idInSub1 < subLength; ++idInSub1)
        {
            let entityIdInIsland = subIslandI[idInSub1];
            if (entityIdInIsland === i) continue;

            let entityId = oxAxis[island[entityIdInIsland]].id;
            let currentEntity = entities[entityId];
            // let lastR = currentEntity.lastR;
            // let deltaR = lastR > 0 ? r - lastR : r;
            // if (deltaR === 0) continue;
            // console.log(deltaR);

            // Old-fashioned (but with numerical errors)
            // let nu = currentEntity.nu;
            // let v0 = currentEntity.v0;
            // let a0 = currentEntity.a0;
            // deltaP1 = solve(deltaR, v0, nu, a0, maxDtr1)

            let oldP0 = copy(currentEntity.p0);
            // currentEntity.p0 = sum(currentEntity.p0, deltaP1);
            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;
            let hasCollided = false; // TerrainCollider.collideLinear(currentEntity, world, p0, p1, true);
            if (hasCollided) {
                // reapply1 = true;
                currentEntity.p0 = oldP0;
            }
            minimize(newDelta1, p0, p1);
            // add(currentEntity.p0, newDelta1);
        }
        // if (reapply1) {
        //     for (let idInSub1 = 0, subLength = subIslandI.length; idInSub1 < subLength; ++idInSub1)
        //     {
        //         let entityIdInIsland = subIslandI[idInSub1];
        //         if (entityIdInIsland === i) continue;
        //         let entityId = oxAxis[island[entityIdInIsland]].id;
        //         let currentEntity = entities[entityId];
        //         let lastR = currentEntity.lastR;
        //         let deltaR = lastR > 0 ? r - lastR : r;
        //         if (deltaR === 0) continue;
        //         currentEntity.p0 = sum(currentEntity.p0, newDelta1);
        //     }
        // }

        // Approach island 1.
        // Prevent from advancing i and j (already clipped)
        // Approach island 2.
        // let reapply2 = false;
        let newDelta2 = [...deltaP2];
        for (let idInSub2 = 0, subLength = subIslandJ.length; idInSub2 < subLength; ++idInSub2)
        {
            let entityIdInIsland = subIslandJ[idInSub2];
            if (entityIdInIsland === j) continue;

            let entityId = oxAxis[island[entityIdInIsland]].id;
            let currentEntity = entities[entityId];
            // let lastR = currentEntity.lastR;
            // let deltaR = lastR > 0 ? r - lastR : r;
            // if (deltaR === 0) continue;
            // console.log(deltaR);

            // Old-fashioned (but with numerical errors)
            // let nu = currentEntity.nu;
            // let v0 = currentEntity.v0;
            // let a0 = currentEntity.a0;
            // deltaP2 = solve(deltaR, v0, nu, a0, maxDtr2);

            let oldP0 = copy(currentEntity.p0);
            // currentEntity.p0 = sum(currentEntity.p0, deltaP2);
            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;
            let hasCollided = false; // TerrainCollider.collideLinear(currentEntity, world, p0, p1, true);
            if (hasCollided) {
                // TODO [] check on which axis...
                // reapply2 = true;
                currentEntity.p0 = oldP0;
            }
            minimize(newDelta2, p0, p1);
            // add(currentEntity.p0, deltaP2);
        }
        // if (reapply2) {
        //     for (let idInSub2 = 0, subLength = subIslandJ.length; idInSub2 < subLength; ++idInSub2) {
        //         let entityIdInIsland = subIslandJ[idInSub2];
        //         if (entityIdInIsland === j) continue;
        //         let entityId = oxAxis[island[entityIdInIsland]].id;
        //         let currentEntity = entities[entityId];
        //         let lastR = currentEntity.lastR;
        //         let deltaR = lastR > 0 ? r - lastR : r;
        //         if (deltaR === 0) continue;
        //         currentEntity.p0 = sum(currentEntity.p0, newDelta2);
        //     }
        // }

        // Concat indexes form both islands into newSubIsland
        let newSubIsland = Array.from(subIslandI).concat(subIslandJ);

        // 2. calculer le nouveau p1 (projected)
        // (bilan des forces > intégration)
        // TODO [approx] time dilation => take the smallest delta t.
        //
        // (*) On calcule v_newIsland et a_newIsland (additif).
        // (*) puis, v0(entité) = v_newIsland et a0(entité) = a_newIsland
        // dtr(entité) = (t1-t) \times min(ldt)
        //
        // (*) enfin, p1(entité) = p0(entité) + solve(t1-r, v_newIsland, a_newIsland).
        // pour tout élément de la nouvelle ile
        let correctionDelta = 0;
        let entityIdsInIslandWhichNeedTerrainPostSolving = [];
        for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
        {
            let entityIdInIsland = newSubIsland[idInNewSub];
            if (entityIdInIsland === i || entityIdInIsland === j) continue;

            let entityId = oxAxis[island[entityIdInIsland]].id;
            let currentEntity = entities[entityId];

            let nu = currentEntity.nu; // TODO [CRIT] check that.
            let v0 = currentEntity.v0; // let v1 = currentEntity.v1;
            let a0 = currentEntity.a0; // let a1 = currentEntity.a1;
            for (let k = 0; k < 3; ++k) {
                v0[k] = newVel[k]; // v1[k] = newVel[k];
                a0[k] = newAcc[k]; // a1[k] = newAcc[k];
            }

            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;

            // let lastR = currentEntity.lastR;
            let deltaR = r; // lastR > 0 ? relativeDt - lastR : relativeDt;
            if (deltaR === 0)
            {
                // TODO [MEDIUM] extract this to  the 'applyCollision' solver
                //p1[ax] = p0[ax];
                continue;
            }

            // console.log('\t' + deltaR);
            let dtr = currentEntity.dtr; // TODO [LOW] should be extracted from time dilation field
            let newP1 = solve(deltaR, v0, nu, a0, dtr);
            let newP1Test = [...newP1];
            for (let k = 0; k < 3; ++k) {
                //p1[k] += newP1[k];
                //newP1Test[k] += p1[k];
            }

            let hasCollided = TerrainCollider.collideLinear(currentEntity, world, p0, p1, true);
            if (hasCollided) {
                let currentDelta = p1[ax] - newP1Test[ax];
                if (abs(currentDelta) > abs(correctionDelta)) correctionDelta = currentDelta;
                // For later recorrection
                //for (let k = 0; k < 3; ++k) p1[k] = newP1Test[k];

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

        // (*) retirer tout membre appartenant à newIsland de mapCollidingPossible
        // 2.1. retirer le couple collision de la map collidingPossible
        // 4. invalider les collisions entre l'entité courante et les autres entités (pas dans la sous-île).
        // Désuet
        // 4.1. décaler les collisions pour toutes les autres entités (r)
        // intégrer la différence de la solution quadratique
        let mcpSize = mapCollidingPossible.length;
        for (let k = mcpSize - 1; k >= 0; --k) {
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
                default: console.log('\t[RBP4] Invalid entry in map colliding possible.');
            }

            let currentIsInvalid = false;
            for (let idInSub1 = 0, subLength = subIslandI.length; idInSub1 < subLength; ++idInSub1)
            {
                let entityIdInSubIslands = subIslandI[idInSub1];
                if (subIslandIndex1 === entityIdInSubIslands || subIslandIndex2 === entityIdInSubIslands
                // && currentAxis === axis
                )
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
                    if (subIslandIndex1 === entityIdInSubIslands || subIslandIndex2 === entityIdInSubIslands
                    // && currentAxis === axis
                    )
                    {
                        mapCollidingPossible.splice(k, 1);
                        break;
                    }
                }
        }

        // 3. lancer le solving de p0 à p1 (terrain + x)
        // (pour toute entité appartenant à newSubIsland) <- Approximation (explicit solving)

        // 5. lancer le solving de p0 à p1' (pour toutes les entités dans l'île mais pas dans la sous-île)
        //
        // (*) effectuer un leapfrog sur:
        // (NewIsland \cross Complementaire(NewIsland)) \union
        // (TerrainK(NewIsland) \cross Complementaire(TerrainK(NewIsland)) \intersect NewIsland)

        let mapCollidingPossibleNew = [];

        let debugFlag = false;
        if (debugFlag)
            console.log(`\t\tProcessing post-collision: ${entities[oxAxis[island[subIslandI[0]]].id].entityId} ` +
                        `[${subIslandI}] vs ` +
                        `${entities[oxAxis[island[subIslandJ[0]]].id].entityId} ` +
                        `[${subIslandJ}] || [${newSubIsland}]`);

        Phase3.solveLeapfrogPostCollision(
            island,
            newSubIsland,
            entityIdsInIslandWhichNeedTerrainPostSolving,
            oxAxis, entities, relativeDt, mapCollidingPossibleNew);

        // Phase3.solveLeapfrogQuadratic(island, oxAxis, entities, relativeDt, mapCollidingPossibleNew);

        // et stocker le résultat avec r inchangé dans mapCollidingPossible.
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
