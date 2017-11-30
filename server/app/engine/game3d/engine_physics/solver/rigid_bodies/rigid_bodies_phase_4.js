/**
 * Integration.
 */

class RigidBodiesPhase4 {

    static solveIslandStepLinear(
        mapCollidingPossible,
        i, j, subIslandI, subIslandJ,
        entities, oxAxis, island)
    {
        mapCollidingPossible.shift();

        if (!subIslandI) {
            subIslandI = [i];
        }
        if (!subIslandJ) {
            subIslandJ = [j];
        }

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
        // const sndtr1 = r * relativeDt;

        // 2. calculer le nouveau p1 (projected)

        // 2.1. retirer le couple collision de la map collidingPossible

        // 3. lancer le solving de p0 à p1 (terrain + x)

        // 4. invalider les collisions entre l'entité courante et les autres entités (pas dans la sous-île).
        // 4.1. décaler les collisions pour toutes les autres entités (r)

        // 5. lancer le solving de p0 à p1' (entités dans l'île mais pas dans la sous-île)

        // 6. loop back
    }

}

export default RigidBodiesPhase4;
