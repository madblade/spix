/**
 * Integration.
 */

class RigidBodiesPhase4 {

    static solveIslandStepLinear(
        mapCollidingPossible,
            // island 1 index
            // island 2 index
            // time got by solver
            // 'x', 'y', 'z' or 'none'
        i, j,
        subIslandI, subIslandJ, newSubIsland,
        entities, oxAxis, island)
    {
        mapCollidingPossible.shift();

        if (!subIslandI) subIslandI = [i];
        if (!subIslandJ) subIslandJ = [j];

        // Compute island properties.
        let sub1Mass = 0;
        let sub2Mass = 0;
        let sub1Vel = [0, 0, 0];
        let sub2Vel = [0, 0, 0];

        // Sum mass.
        // {
        for (let idInSub1 = 0, sub1Length = subIslandI.length; idInSub1 < sub1Length; ++idInSub1)
            sub1Mass += entities[oxAxis[island[subIslandI[idInSub1]]].id].mass;
        for (let idInSub2 = 0, sub2Length = subIslandJ.length; idInSub2 < sub2Length; ++idInSub2)
            sub2Mass += entities[oxAxis[island[subIslandJ[idInSub2]]].id].mass;
        // }

        // Compute uniform speed.
        {
            let e1 = entities[oxAxis[island[subIslandI[0]]].id];
            let vel1 = e1.v0;
            // let nu1 = e1.nu;
            for (let t = 0; t < 3; ++t) sub1Vel[t] = vel1[t];

            let e2 = entities[oxAxis[island[subIslandJ[0]]].id];
            let vel2 = e2.v0;
            // let nu2 = e2.nu;
            for (let t = 0; t < 3; ++t) sub2Vel[t] = vel2[t];
        }

        // 1. collision -> mettre p0 à p1 (t_collision)
        // (pour toute entité appartenant à newSubIsland) <- Approximation (explicit solving)
        //
        // (*) à t0 + r, toutes les entités dans island1 + island2
        // sont mises à p0(entité) = p0(entité) + solve(r-r_last(entité), v_entité, a_entité, dtr(entité)).

        // 2. calculer le nouveau p1 (projected)
        // (bilan des forces > intégration)
        // TODO [approx] dilatation temporelle => prendre le delta t le plus petit.
        //
        // (*) On calcule v_newIsland et a_newIsland (additif).
        // (*) puis, v0(entité) = v_newIsland et a0(entité) = a_newIsland
        // dtr(entité) = (t1-t) \times mean(ldt)
        //
        // (*) enfin, p1(entité) = p0(entité) + solve(t1-r, v_newIsland, a_newIsland).
        // pour tout élément de la nouvelle ile

        // 2.1. retirer le couple collision de la map collidingPossible
        // 3. lancer le solving de p0 à p1 (terrain + x)
        // (pour toute entité appartenant à newSubIsland) <- Approximation (explicit solving)
        // 4. invalider les collisions entre l'entité courante et les autres entités (pas dans la sous-île).
        // 4.1. décaler les collisions pour toutes les autres entités (r)
        // intégrer la différence de la solution quadratique
        // 5. lancer le solving de p0 à p1' (pour toutes les entités dans l'île mais pas dans la sous-île)
        //
        // (*) retirer tout membre appartenant à newIsland de mapCollidingPossible
        // (*) effectuer un leapfrog sur NewIsland \cross Complementaire(NewIsland)
        // et stocker le résultat avec r inchangé dans mapCollidingPossible.

        // 6. loop back
    }

}

export default RigidBodiesPhase4;
