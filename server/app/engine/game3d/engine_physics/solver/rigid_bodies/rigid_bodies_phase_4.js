/**
 * Integration.
 */

import TerrainCollider from '../collision/terrain';
import Phase3 from './rigid_bodies_phase_3';

class RigidBodiesPhase4 {

    static solveIslandStepLinear(
        mapCollidingPossible,
            // island 1 index
            // island 2 index
            // time got by solver
            // 'x', 'y', 'z' or 'none'
        i, j, r, axis,
        subIslandI, subIslandJ, newSubIsland,
        entities,
        objectIndexInIslandToSubIslandXIndex,
        objectIndexInIslandToSubIslandYIndex,
        objectIndexInIslandToSubIslandZIndex,
        oxAxis, island, world, relativeDt)
    {
        mapCollidingPossible.shift();

        if (!subIslandI || subIslandI.length === 0) subIslandI = [i];
        if (!subIslandJ || subIslandJ.length === 0) subIslandJ = [j];

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

            let e2 = entities[oxAxis[island[subIslandJ[0]]].id];
            let vel2 = e2.v0;
            let acc2 = e2.a0;
            // let nu2 = e2.nu;
            for (let t = 0; t < 3; ++t)
            {
                sub2Vel[t] = vel2[t];
                sub2Acc[t] = acc2[t];
            }

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
        let add = function(vec1, vec2) {
            for (let k = 0; k < 3; ++k) vec1[k] += vec2[k];
        };
        // Get max dtr.
        let maxDtr = 1;
        for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
        {
            let entityIdInSubIslands = newSubIsland[idInNewSub];
            let entityId = oxAxis[island[entityIdInSubIslands]].id;
            let currentEntity = entities[entityId];
            let currentDtr = currentEntity.dtr;
            if (currentDtr > maxDtr) maxDtr = currentDtr;
        }
        for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
        {
            let entityIdInIsland = newSubIsland[idInNewSub];
            if (entityIdInIsland === i || entityIdInIsland === j)
                continue;

            let entityId = oxAxis[island[entityIdInIsland]].id;
            let currentEntity = entities[entityId];

            let lastR = currentEntity.lastR;
            let deltaR = lastR > 0 ? r - lastR : r;
            if (deltaR === 0)
                continue;

            let nu = currentEntity.nu; // TODO [CRIT] check that.
            let v0 = currentEntity.v0;
            let a0 = currentEntity.a0;

            // Prevent from advancing i and j (already clipped)
            add(currentEntity.p0, solve(deltaR, v0, nu, a0, maxDtr));
        }

        // 2. calculer le nouveau p1 (projected)
        // (bilan des forces > intégration)
        // TODO [approx] dilatation temporelle => prendre le delta t le plus petit.
        //
        // (*) On calcule v_newIsland et a_newIsland (additif).
        // (*) puis, v0(entité) = v_newIsland et a0(entité) = a_newIsland
        // dtr(entité) = (t1-t) \times min(ldt)
        //
        // (*) enfin, p1(entité) = p0(entité) + solve(t1-r, v_newIsland, a_newIsland).
        // pour tout élément de la nouvelle ile
        let entityIdsInIslandWhichNeedTerrainPostSolving = [];
        for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
        {
            let entityIdInIsland = newSubIsland[idInNewSub];
            if (entityIdInIsland === i || entityIdInIsland === j)
                continue;

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

            let lastR = currentEntity.lastR;
            let deltaR = lastR > 0 ? r : r - lastR;
            if (deltaR === 0)
            {
                let ax;
                switch (axis) {
                    case 'x': ax = 0; break;
                    case 'y': ax = 1; break;
                    case 'z': ax = 2; break;
                    default : console.log('[Phase IV] [BAD] invalid axis.'); break;
                }

                // TODO [MEDIUM] extract this to the 'applyCollision' solver
                p1[ax] = p0[ax];
                continue;
            }

            let dtr = currentEntity.dtr; // TODO [LOW] should be extracted from time dilation field
            let newP1 = solve(deltaR, v0, nu, a0, dtr);
            for (let k = 0; k < 3; ++k) {
                p1[k] += newP1[k];
            }

            let hasCollided = TerrainCollider.collideLinear(currentEntity, world, p0, p1, true);
            if (hasCollided) {
                entityIdsInIslandWhichNeedTerrainPostSolving.push(entityIdInIsland);
                console.log('An entity needs resolving within its island because of a fixed terrain collision.');
            }

            currentEntity.lastR = r;
        }

        // (*) retirer tout membre appartenant à newIsland de mapCollidingPossible
        // 2.1. retirer le couple collision de la map collidingPossible
        // 4. invalider les collisions entre l'entité courante et les autres entités (pas dans la sous-île).
        // Désuet   // 4.1. décaler les collisions pour toutes les autres entités (r)
                    // intégrer la différence de la solution quadratique
        let mcpSize = mapCollidingPossible.length;
        for (let k = mcpSize - 1; k >= 0; --k) {
            let current = mapCollidingPossible[k];
            let island1Index = current[0];
            let island2Index = current[1];
            let ax = current[3];

            let subIslandIndex1;
            let subIslandIndex2;
            switch (ax) {
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
                default: console.log('[RBP4] Invalid entry in map colliding possible.');
            }

            for (let idInNewSub = 0, newSubLength = newSubIsland.length; idInNewSub < newSubLength; ++idInNewSub)
            {
                let entityIdInSubIslands = newSubIsland[idInNewSub];
                if (subIslandIndex1 === entityIdInSubIslands || subIslandIndex2 === entityIdInSubIslands)
                    mapCollidingPossible.splice(k, 1);
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
        // let crossIsland = [];
        // for (let k = )
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
