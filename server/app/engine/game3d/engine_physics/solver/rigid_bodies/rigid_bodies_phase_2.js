/**
 * Island computation,
 * early terrain collision.
 */

import TerrainCollider from '../collision/terrain';

class RigidBodiesPhase2
{
    static computeIslands(leapfrogArray, searcher, oxToIslandIndex, islands)
    {
        let numberOfEntities = leapfrogArray.length;
        let islandIndex = 0;
        oxToIslandIndex.fill(-2); // -2 unaffected, -1 isolated, 0+ index of island
        for (let i = 0; i < numberOfEntities; ++i)
        {
            let xIndex = leapfrogArray[i][3];
            let inheritedIslandIndex = oxToIslandIndex[xIndex];
            let newIsland = searcher.computeIsland(leapfrogArray, i);
            let il = newIsland.length;

            if (inheritedIslandIndex !== -2)
            {
                if (inheritedIslandIndex === -1)
                    throw Error('[RigidBodies] @ islands: I think ' +
                        'no item present in an 1-island should be rediscovered ' +
                        'by the algorithm. (?)');
                switch (il) {
                    case 0:
                        // throw Error('[RigidBodies] got a 0-length island.');
                        break;
                    case 1:
                        if (oxToIslandIndex[newIsland[0]] !== inheritedIslandIndex)
                            throw Error('[RigidBodies] @ islands: verification failed ' +
                                'on basic 1-island criterion.');
                        break;
                    default:
                        let toAugmentIsland = islands[inheritedIslandIndex];
                        for (let j = 0; j < il; ++j) {
                            let nij = newIsland[j];
                            if (toAugmentIsland.indexOf(nij) < 0) {
                                oxToIslandIndex[nij] = inheritedIslandIndex;
                                toAugmentIsland.push(nij);
                            }
                        }
                        break;
                }
            }
            else
            {
                switch (il) {
                    case 0:
                        // console.error('[RigidBodies] got a 0-length island.');
                        break;
                    case 1:
                        oxToIslandIndex[newIsland[0]] = -1; // May move freely.
                        break;
                    default:
                        for (let j = 0; j < il; ++j)
                            oxToIslandIndex[newIsland[j]] = islandIndex;
                        islands.push(newIsland);
                        islandIndex++;
                        break;
                }
            }
        }

        // Merge islands.
        // This could be optimised but I will drop support for this solver.
        for (let i = 0; i < islands.length; ++i)
        {
            let islandI = islands[i];
            for (let j = islands.length - 1; j > i; --j)
            {
                let islandJ = islands[j];
                for (let k = 0; k < islandI.length; ++k) {
                    if (islandJ.indexOf(islandI[k]) > 0) {
                        // Merge within I and pop.
                        for (let q = 0; q < islandJ.length; ++q) {
                            let ijq = islandJ[q];
                            if (islandI.indexOf(ijq) < 0)
                                islandI.push(ijq);
                        }
                        islands.splice(j, 1);
                        break;
                    }
                }
            }
        }

        let dbg = false;
        if (dbg)
            for (let i = 0; i < islands.length; ++i)
                islands[i].sort();
    }

    /**
     * Solving terrain collisions globally at the moment.
     * Not only lonely islands.
     */
    static collideLonelyIslandsWithTerrain(
        oxAxis, entities,
        oxToIslandIndex, islands,
        world, rigidBodiesSolver
    )
    {
        for (let oi = 0, ol = oxAxis.length; oi < ol; ++oi)
        {
            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') continue;

            let entityIndex = oxAxis[oi].id;
            let currentEntity = entities[entityIndex];
            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;

            // Cast on current world to prevent x crossing through matter.
            // const dtr = currentEntity.dtr; // To use time dilation

            // Filter here for lonely islands.
            // let islandId = oxToIslandIndex[oi];
            // let doProject = islandId === -1 || islandId === -2;
            let abs = Math.abs;
            let g = rigidBodiesSolver.getGravity(world, world.worldId, p0[0], p0[1], p0[2]);
            if (abs(g[0]) > 0 && abs(g[1]) === 0 && abs(g[2]) === 0)
                TerrainCollider.collideLinearX(currentEntity, world, p0, p1, true);
            else if (abs(g[1]) > 0 && abs(g[0]) === 0 && abs(g[2]) === 0)
                TerrainCollider.collideLinearY(currentEntity, world, p0, p1, true);
            else // if (abs(g[2]) > 0 && abs(g[1]) === 0 && abs(g[0]) === 0)
                TerrainCollider.collideLinearZ(currentEntity, world, p0, p1, true);

            // Remember to apply the same kind of changes to the simple entity + terrain solver (just below).
        }
    }

    static simpleCollideEntitiesWithTerrain(
        oxAxis, entities, world, rigidBodiesSolver
    )
    {
        for (let oi = 0, ol = oxAxis.length; oi < ol; ++oi)
        {
            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') continue;

            let entityIndex = oxAxis[oi].id;
            let currentEntity = entities[entityIndex];
            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;

            // Cast on current world to prevent x crossing through matter.
            // const dtr = currentEntity.dtr;

            let abs = Math.abs;
            let g = rigidBodiesSolver.getGravity(world, world.worldId, p0[0], p0[1], p0[2]);
            let hasCollided;
            if (abs(g[0]) > 0 && abs(g[1]) === 0 && abs(g[2]) === 0)
                hasCollided = TerrainCollider.collideLinearX(currentEntity, world, p0, p1, true);
            else if (abs(g[1]) > 0 && abs(g[0]) === 0 && abs(g[2]) === 0)
                hasCollided = TerrainCollider.collideLinearY(currentEntity, world, p0, p1, true);
            else // if (abs(g[2]) > 0 && abs(g[1]) === 0 && abs(g[0]) === 0)
                hasCollided = TerrainCollider.collideLinearZ(currentEntity, world, p0, p1, true);

            const dbg = false;
            if (dbg && hasCollided) {
                console.log(entityIndex);
            }
            // Here bounce components could be reported as the inverse velocity at the impact point.
        }
    }
}

export default RigidBodiesPhase2;
