/**
 * Island computation,
 * early terrain collision.
 */

import TerrainCollider from '../collision/terrain';

class RigidBodiesPhase2 {

    static computeIslands(leapfrogArray, searcher, oxToIslandIndex, islands)
    {
        let numberOfEntities = leapfrogArray.length;
        // let oxToIslandIndex = new Int32Array(numberOfEntities);
        // let islands = [];
        let islandIndex = 0;
        oxToIslandIndex.fill(-2); // -2 unaffected, -1 isolated, 0+ index of island
        //console.log(numberOfEntities + ' entities');
        for (let i = 0; i < numberOfEntities; ++i) {
            let xIndex = leapfrogArray[i][3];
            let inheritedIslandIndex = oxToIslandIndex[xIndex];
            let newIsland = searcher.computeIsland(leapfrogArray, i);
            let il = newIsland.length;

            if (inheritedIslandIndex !== -2) {
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
            else {
                switch (il) {
                    case 0:
                        // throw Error('[RigidBodies] got a 0-length island.');
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

            // TODO [DBG] check new island and former for redundancy.
        }

        // Merge islands.
        // TODO [HIGH] this can be heavily optimised.
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
    }

    /**
     * Solving terrain collisions globally at the moment.
     * Not only lonely islands.
     */
    static collideLonelyIslandsWithTerrain(oxAxis, entities, oxToIslandIndex, islands, world)
    {
        for (let oi = 0, ol = oxAxis.length; oi < ol; ++oi) {
        // for (let islandId = 0, nbIslands = islands.length; islandId < nbIslands; ++islandId) {
        //     let currentIsland = islands[islandId];
        //     if (currentIsland.length !== 1) continue;
        //     let oi = currentIsland[0];

            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') continue;

            let entityIndex = oxAxis[oi].id;
            let currentEntity = entities[entityIndex];
            let p0 = currentEntity.p0;
            let p1 = currentEntity.p1;

            // Cast on current world to prevent x crossing through matter.
            // const dtr = currentEntity.dtr; //TODO [HIGH] use dtr

            // TODO [HIGH] filter for lonely islands.
            // let islandId = oxToIslandIndex[oi];
            // let doProject = islandId === -1 || islandId === -2;
            /*let hasCollided = */TerrainCollider.collideLinear(currentEntity, world, p0, p1, true);
            // TODO [MEDIUM] report bounce components.
        }
    }
}

export default RigidBodiesPhase2;
