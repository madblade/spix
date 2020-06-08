/**
 *
 */

'use strict';

import { Searcher } from '../collision/searcher';

import Phase1 from './rigid_bodies_phase_1';
import Phase2 from './rigid_bodies_phase_2';
import Phase3 from './rigid_bodies_phase_3';
import Phase4 from './rigid_bodies_phase_4';
import Phase5 from './rigid_bodies_phase_5';
import { WorldType } from '../../../model_world/model';

// Enhancement: island caching

class RigidBodies
{
    static eps = .00000001;// .00001;
    static gravityConstant = 2 * -0.00980665;

    static crossEntityCollision = true; // THIS ACTIVATES CROSS-COLLISION, EXPERIMENTAL
    static creativeMode = false; // THIS REMOVES GRAVITY INTEGRATION (but not rotation changes)
    // static gravityConstant = 0;

    constructor(refreshRate)
    {
        //
        this._gravity = [0, 0, RigidBodies.gravityConstant];
        this._gravityWater = [0, 0, 0.1 * RigidBodies.gravityConstant];
        // this._gravity = [0, 0, 0];
        this._globalTimeDilation = 25;
        // this._globalTimeDilation = 0.05;
        this._refreshRate = refreshRate;

        this._variableGravity = true;
        this._worldCenter = [0, 0, -100];
        //
    }

    get gravity() { return this._gravity; }
    set gravity(g) { this._gravity = g; }
    get globalTimeDilation() { return this._globalTimeDilation; }
    get refreshRate() { return this._refreshRate; }

    // Advanced gravity management.
    getGravity(world, worldId, x, y, z)
    {
        if (!this._variableGravity || world.worldInfo.type !== WorldType.CUBE)
        {
            return this._gravity; // world.isWater(x, y, z) ? this._gravityWater : this._gravity;
        }

        const center = world.worldInfo.center; // this._worldCenter;
        let radius = parseFloat(world.worldInfo.radius);
        let abs = Math.abs;
        let max = Math.max;
        let min = Math.min;
        const sX = world.xSize;
        const sY = world.ySize;
        const sZ = world.zSize;
        let cX = sX * center.x + sX / 2;
        let cY = sY * center.y + sY / 2;
        let cZ = sZ * center.z + sZ / 2;

        const dX = abs(x - cX);
        const dY = abs(y - cY);
        const dZ = abs(z - cZ);
        const xPlus = x > cX;
        const yPlus = y > cY;
        const zPlus = z > cZ;

        // Clamp on main faces to keep camera rotation updates to a minimum.
        let squaredWithSmoothBorders = true;
        let squaredRadius = 2; // Should this equal 1.6, the entity height?
        const gravityNorm = (world.isWater(x, y, z) ? 0.1 : 1) * RigidBodies.gravityConstant;

        if (squaredWithSmoothBorders)
        {
            if (dX > max(dY, dZ) + squaredRadius)
                return [(xPlus ? 1 : -1) * gravityNorm, 0, 0];
            else if (dY > max(dX, dZ) + squaredRadius)
                return [0, (yPlus ? 1 : -1) * gravityNorm, 0];
            else if (dZ > max(dX, dY) + squaredRadius)
                return [0, 0, (zPlus ? 1 : -1) * gravityNorm];
        }

        // take at -2 (under feet and not only on raw border)
        let rad = max(max(radius * sX, radius * sY), radius * sZ) - 1;
        if (
            abs(cX - x) < radius * sX &&
            abs(cY - y) < radius * sY &&
            abs(cZ - z) < radius * sZ
        )
            rad = min(min(abs(cX - x), abs(cY - y)), abs(cZ - z)) - 1;

        // const rsx = radius * sX;
        // const rsxm = cX - rsx; const rsxp = cX + rsx;
        const rsxm = cX - rad; const rsxp = cX + rad;
        cX = x < rsxm ? rsxm : x > rsxp ? rsxp : x;
        const rsym = cY - rad; const rsyp = cY + rad;
        cY = y < rsym ? rsym : y > rsyp ? rsyp : y;
        const rszm = cZ - rad; const rszp = cZ + rad;
        cZ = z < rszm ? rszm : z > rszp ? rszp : z;

        let power = 4.0;
        let ddx = parseFloat(cX) - parseFloat(x);
        let ddy = parseFloat(cY) - parseFloat(y);
        let ddz = parseFloat(cZ) - parseFloat(z);
        let dd = Math.pow(Math.pow(ddx, power) + Math.pow(ddy, power) + Math.pow(ddz, power), 1 / power);
        let direction = [
            ddx !== 0 ? Math.pow(Math.abs(ddx), power + 1) / (ddx * dd) : 0,
            ddy !== 0 ? Math.pow(Math.abs(ddy), power + 1) / (ddy * dd) : 0,
            ddz !== 0 ? Math.pow(Math.abs(ddz), power + 1) / (ddz * dd) : 0
        ];
        let norm = Math.sqrt(Math.pow(direction[0], 2) + Math.pow(direction[1], 2) + Math.pow(direction[2], 2));
        direction[0] *= -gravityNorm / norm;
        direction[1] *= -gravityNorm / norm;
        direction[2] *= -gravityNorm / norm;
        return direction;
    }

    // Advanced time flow customization.
    getTimeDilation(worldId, x, y, z)
    {
        if (worldId === 666) {
            return 1 + Math.abs(x * y * z);
        }
        return 1;
    }

    solve(objectOrderer, eventOrderer, em, wm, xm, o, relativeDtMs)
    {
        // const epsilon = RigidBodies.eps;

        const passId = Math.random();
        let timeDilation = this.globalTimeDilation;
        let absoluteDt = this.refreshRate / timeDilation;
        let relativeDt = relativeDtMs / timeDilation;
        // if (relativeDt !== 0.64) console.log(relativeDt);
        // let relativeDt = absoluteDt;
        // let maxSpeed = Entity.maxSpeed;
        // let maxSpeed2 = maxSpeed * maxSpeed;

        if (relativeDt > 3 * absoluteDt)
        {
            console.log('Warn: lagging at ' +
                `${Math.floor(100 * relativeDt / absoluteDt)}%.`);
            relativeDt = 3 * absoluteDt;
        }

        // Decouple entities from worlds.
        // A given entity can span across multiple worlds.
        let entities = em.entities;
        let events = eventOrderer.events;

        // For each world,
        let eventUniverseAxes = eventOrderer.axes;
        let objectUniverseAxes = objectOrderer.axes;
        objectUniverseAxes.forEach((objectWorldAxes, worldId) => {
            let world = wm.getWorld(worldId);
            let eventWorldAxes = eventUniverseAxes.get(world);
            let oxAxis = objectWorldAxes[0];
            let oyAxis = objectWorldAxes[1];
            let ozAxis = objectWorldAxes[2];
            let searcher = new Searcher(entities, oxAxis, oyAxis, ozAxis);

            if (oxAxis.length !== oyAxis.length || oxAxis.length !== ozAxis.length)
                throw Error('Inconsistent lengths among axes.');

            // 1. Sum inputs/impulses, fields.

            // 2. Compute (x_i+1, a_i+1, v_i+1), order Leapfrog's incremental term.
            //    Computation takes into account local time dilation.
            // Summing constraints is done by summing globals (i.e. global gravity)
            // with local functional events (i.e. position-dependant gravity)
            // with local custom events (applied from the events array).

            // LOCAL EVENTS.
            if (eventWorldAxes)
                Phase1.processLocalEvents(eventOrderer, entities, events, worldId, eventWorldAxes, oxAxis);

            // GLOBAL EVENTS, INPUTS & COMPUTATIONS.
            let leapfrogArray = new Array(oxAxis.length);
            Phase1.processGlobalEvents(entities, world, worldId, relativeDt, oxAxis, leapfrogArray, passId, this);

            if (RigidBodies.crossEntityCollision)
            {
                RigidBodies.solveIntegrateAABB(
                    oxAxis, entities, world, worldId, searcher, xm, objectOrderer, o, this
                );
                // RigidBodies.solveCrossEntityHardCollision(
                //     world, entities, leapfrogArray, searcher, oxAxis, relativeDt, this
                // );
            }
            else
            {
                Phase2.simpleCollideEntitiesWithTerrain(oxAxis, entities, world, this);
                Phase5.applyIntegration(
                    entities, worldId, oxAxis, world,
                    xm, objectOrderer, searcher, o, this);
            }

            // 7. Apply new positions, correct (v_i+1, a_i+1) and resulting constraints,
            //    smoothly slice along constrained boundaries until component is extinct.

            // Integration.
            // Phase5.applyIntegration(
            //     entities, worldId, oxAxis, world,
            //     xm, objectOrderer, searcher, o, this);

            // 8. Perform updates in optimization structures.
            //    Perform updates in consistency maps.
        });
    }

    static solveIntegrateAABB(
        oxAxis, entities, world, worldId, searcher, xm, objectOrderer, o, rigidBodiesSolver
    )
    {
        Phase2.simpleCollideEntitiesWithTerrain(
            oxAxis, entities, world, rigidBodiesSolver
        );
        Phase5.simpleCollideIntegrate(
            entities, worldId, oxAxis, world,
            xm, objectOrderer, searcher, o, rigidBodiesSolver
        );
    }

    static solveCrossEntityHardCollision(
        world, entities,
        leapfrogArray, searcher, oxAxis, relativeDt, rigidBodiesSolver
    )
    {
        let abs = Math.abs;

        // Sort entities according to incremental term.
        // Remember leapfrogs within objects, reordering them within islands
        // is probably better than sorting a potentially huge array.
        let inf = x => Math.max(abs(x[0]), abs(x[1]), abs(x[2]));
        leapfrogArray.sort((a, b) =>
            inf(b) - inf(a)
        );
        // Note: a - b natural order, b - a reverse order
        // abs(b[0]) + abs(b[1]) + abs(b[2]) - abs(a[0]) - abs(a[1]) - abs(a[2])

        // Rebuild mapping after having sorted leapfrogs.
        let reverseLeapfrogArray = new Int32Array(leapfrogArray.length);
        for (let i = 0, l = leapfrogArray.length; i < l; ++i)
            reverseLeapfrogArray[leapfrogArray[i][3]] = i;

        // 4. Compute islands, cross world, by axis order.
        let numberOfEntities = leapfrogArray.length;
        let oxToIslandIndex = new Int32Array(numberOfEntities);
        let islands = [];

        Phase2.computeIslands(leapfrogArray, searcher, oxToIslandIndex, islands);

        // 3. Snap x_i+1 with terrain collide, save non-integrated residuals
        // as bounce components with coefficient & threshold (heat).
        Phase2.collideLonelyIslandsWithTerrain(oxAxis, entities, oxToIslandIndex, islands, world, rigidBodiesSolver);

        // add leapfrog term
        // get array of all xs sorted by axis

        // 5. Broad phase: in every island, recurse from highest to lowest leapfrog's term
        //    check neighbours for min distance in linearized trajectory
        //    detect and push PROBABLY COLLIDING PAIRS.

        // 6. Narrow phase, part 1: for all probably colliding pairs,
        //    solve X² leapfrog, save first all valid Ts
        //    keep list of ordered Ts across pairs.
        if (islands.length > 0) {
            // console.log(islands);
        }

        for (let currentIslandIndex = 0, il = islands.length; currentIslandIndex < il; ++currentIslandIndex)
        {
            let island = islands[currentIslandIndex];
            // island.sort((a,b) => reverseLeapfrogArray[b] - reverseLeapfrogArray[a]);
            let mapCollidingPossible = [];

            // 1. Sort colliding possible.

            // Solve leapfrog and sort according to time.
            Phase3.solveLeapfrogQuadratic(
                island,
                oxAxis, entities, relativeDt,
                mapCollidingPossible);

            if (mapCollidingPossible.length < 1) continue;

            // Narrow phase, part 2: for all Ts in order,
            //    set bodies as 'in contact' or 'terminal' (terrain),
            //    compute new paths (which )are not more than common two previous) while compensating forces
            //    so as to project the result into directions that are not occluded
            //      -> bouncing will be done in next iteration to ensure convergence
            //      -> possible to keep track of the energy as unsatisfied work of forces
            //    solve X² leapfrog for impacted trajectories and insert new Ts in the list (map?)
            //    End when there is no more collision to be solved.
            mapCollidingPossible.sort((a, b) => a[2] - b[2]);

            // 2. First colliding ->
            //      join
            //      move to collision point
            //      compute new trajectory (leapfrog²)
            //      collide again with terrain
            //      compute colliding possible with all others
            //      (invalidate collision with others) -> optional (discarded afterwards anyway)

            let subIslandsX = []; // For sub-sampled physics, must be sorted and
            let subIslandsY = []; // kept coherent before every pass in the I/J collider.
            let subIslandsZ = [];

            let objectIndexInIslandToSubIslandXIndex = new Int16Array(island.length);
            let objectIndexInIslandToSubIslandYIndex = new Int16Array(island.length);
            let objectIndexInIslandToSubIslandZIndex = new Int16Array(island.length);

            objectIndexInIslandToSubIslandXIndex.fill(-1);
            objectIndexInIslandToSubIslandYIndex.fill(-1);
            objectIndexInIslandToSubIslandZIndex.fill(-1);

            // For each entity in current island
            let complicatedFlag = mapCollidingPossible.length > 1;
            let solverPassId = 1;
            let debugFlag = false;
            if (debugFlag)
            {
                if (complicatedFlag) console.log(`Complicated collision solving: ${island}`);
                else console.log(`Collision solving: island ${island}, map ${mapCollidingPossible}`);

                console.log('New island pass');
                console.log(island);
            }

            let dbg = false;
            if (dbg)
            {
                let eids = [];
                for (let isl = 0; isl < island.length; ++isl)
                    eids.push(oxAxis[island[isl]].id);
                console.log(eids);
            }
            let reloop = false;

            while (mapCollidingPossible.length > 0)
            {
                if (dbg)
                {
                    console.log(
                        `\t${mapCollidingPossible[0]} ` +
                        `| ${reloop ? 'stacked' : 'shifted'} | ${mapCollidingPossible.length}`
                    );
                }
                reloop = false;
                let ii = mapCollidingPossible[0][0];   // island 1 index
                let jj = mapCollidingPossible[0][1];   // island 2 index
                let rr = mapCollidingPossible[0][2];   // time got by solver
                let axis = mapCollidingPossible[0][3]; // 'x', 'y', 'z' or 'none'

                if (debugFlag && complicatedFlag) {
                    let msg = `\tPass ${solverPassId++} : ${mapCollidingPossible.length} elements to process `;
                    for (let m = 0; m < mapCollidingPossible.length; ++m) {
                        msg += `(${mapCollidingPossible[m][0]}, ${mapCollidingPossible[m][1]}); `;
                    }
                    const xIndex1 = island[ii];
                    const xIndex2 = island[jj];
                    const id1 = oxAxis[xIndex1].id;
                    const id2 = oxAxis[xIndex2].id;
                    const e1 = entities[id1];
                    const e2 = entities[id2];
                    msg += `\n\tEntity ${e1.entityId} : ${e1.p0[2].toFixed(5)} -> ${e1.p1[2].toFixed(5)}`;
                    msg += `\n\tEntity ${e2.entityId} : ${e2.p0[2].toFixed(5)} -> ${e2.p1[2].toFixed(5)}`;
                    msg += `\n\tColliding on ${axis} axis, at t = ${rr.toFixed(10)}`;
                    console.log(msg);
                }
                // \DEBUG

                let subIslandI = Phase3.getSubIsland(ii, axis,
                    objectIndexInIslandToSubIslandXIndex,
                    objectIndexInIslandToSubIslandYIndex,
                    objectIndexInIslandToSubIslandZIndex,
                    subIslandsX, subIslandsY, subIslandsZ);

                let subIslandJ = Phase3.getSubIsland(jj, axis,
                    objectIndexInIslandToSubIslandXIndex,
                    objectIndexInIslandToSubIslandYIndex,
                    objectIndexInIslandToSubIslandZIndex,
                    subIslandsX, subIslandsY, subIslandsZ);

                if (debugFlag && complicatedFlag)
                    console.log('\tApplying collision...');
                const eps = 1e-6;
                Phase3.applyCollision(
                    ii, jj, rr, axis,
                    island, oxAxis, entities, relativeDt, eps);

                // 1. apply step to newSubIsland
                // 2.1. invalidate for each (newSubIslandMember)
                // 2.2. resolve for each (newSubIslandMember x anyother)
                // 3. update mapCollidingPossible

                if (debugFlag && complicatedFlag)
                    console.log('\tSolving the island step...');

                let oldLength = mapCollidingPossible.length;
                Phase4.solveIslandStepLinear(
                    mapCollidingPossible,
                    ii, jj, rr, axis, subIslandI, subIslandJ,
                    entities,
                    objectIndexInIslandToSubIslandXIndex,
                    objectIndexInIslandToSubIslandYIndex,
                    objectIndexInIslandToSubIslandZIndex,
                    oxAxis, island, world, relativeDt);

                if (mapCollidingPossible.length >= oldLength)
                    reloop = true;

                if (debugFlag && complicatedFlag)
                {
                    const xIndex1 = island[ii];
                    const xIndex2 = island[jj];
                    const id1 = oxAxis[xIndex1].id;
                    const id2 = oxAxis[xIndex2].id;
                    const e1 = entities[id1];
                    const e2 = entities[id2];
                    let msg = `\t\t/Entity ${e1.entityId} : ${e1.p0[2].toFixed(5)} -> ${e1.p1[2].toFixed(5)}`;
                    msg +=  `\n\t\t/Entity ${e2.entityId} : ${e2.p0[2].toFixed(5)} -> ${e2.p1[2].toFixed(5)}`;
                    console.log(msg);
                }

                if (debugFlag && complicatedFlag)
                    console.log('\tMerging sub-islands...');
                Phase3.mergeSubIslands(
                    ii, jj, subIslandI, subIslandJ,
                    objectIndexInIslandToSubIslandXIndex,
                    objectIndexInIslandToSubIslandYIndex,
                    objectIndexInIslandToSubIslandZIndex,
                    subIslandsX, subIslandsY, subIslandsZ, axis);
                if (debugFlag && complicatedFlag)
                    console.log('\tMerged!');
            }

            // Solved!
        }
    }

    static add(result, toAdd)
    {
        result[0] += toAdd[0];
        result[1] += toAdd[1];
        result[2] += toAdd[2];
    }
}

export default RigidBodies;
