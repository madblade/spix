/**
 * Island solving.
 */

class RigidBodiesPhase3 {

    static solveBabylon(a, b, c, sup, debug) {
        if (a === 0) {
            if (b === 0)
                return 0;
            else
                return -c / b;
        }
        let r = 0;
        let delta = b * b - 4 * a * c;
        if (delta > 0) {
            let r1 = (-b - Math.sqrt(delta)) / (2 * a);
            let r2 = (-b + Math.sqrt(delta)) / (2 * a);
            if (r1 >= 0 && r2 >= 0)
                r = Math.min(r1, r2);
            else if (r1 >= 0 || r2 >= 0)
                r = Math.max(Math.max(r1, r2), 0);
            else
                r = sup;
        } else if (delta === 0) {
            if (debug) console.log('delta = 0');
            r = -b / (2 * a);
        }
        return r;
    }

    static solveSecondOrder(
        a1, a2,
        b1, b2,
        p10, p20,
        p11, p21, // Unnecessary
        w1, w2,
        fw, relativeDt)
    {
        // Check for snapping on first trajectory.
        let rp1 = RigidBodiesPhase3.solveBabylon(a1, b1, p10 - p11, 2 * relativeDt);

        // Check for snapping on second trajectory.
        let rp2 = RigidBodiesPhase3.solveBabylon(a2, b2, p20 - p21, 2 * relativeDt);

        // Solve free 2-collision.
        let rp12 = RigidBodiesPhase3.solveBabylon(a1 - a2, b1 - b2, fw * w1 + fw * w2 + p10 - p20, 2 * relativeDt, true);
        // let rp12 = 2 * relativeDt;
        // if (a1 !== a2)
        // else if (b1 !== b2)
        //     rp12 = (fw * w1 + fw * w2 + p10 - p20) / (b2 - b1);
        const debug = false;
        if (rp12 === 0)
        {
            if (debug) console.log('Unlikely zero output from babylon solver...');
        }

        // Both trajectories should not be snapped at the same time.
        if (rp12 > rp1 && relativeDt > rp1 && rp12 > rp2 && relativeDt > rp2) {
            console.log('Two colliding bodies saw their trajectory snapped on the same axis... Think about it.');
        }

        // In case of (1)-snap.
        if (rp12 > rp1 && relativeDt > rp1 && rp1 >= 0) {
            // Solve constrained (1)-end-of-line collision.
            console.log('Constrained (1).');
            let rp3 = RigidBodiesPhase3.solveBabylon(a2, b2, -fw * w1 - fw * w2 + p20 - p11, 2 * relativeDt);
            if (rp12 > rp3 && rp3 > 0) rp12 = rp3;
        }

        // In case of (2)-snap.
        if (rp12 > rp2 && relativeDt > rp2 && rp2 >= 0) {
            console.log('Constrained (2).');
            // Solve constrained (2)-end-of-line collision.
            let rp4 = RigidBodiesPhase3.solveBabylon(a1, b1, fw * w1 + fw * w2 + p10 - p21, 2 * relativeDt);
            if (rp12 > rp4 && rp4 > 0) rp12 = rp4;
        }


        if (rp12 < 0 || rp12 >= relativeDt) {
            // TODO [CRIT] reset this comment to enable debug
            // console.log('r computation error');
            // console.log(`\tb1, b2 = ${b1}, ${b2}\n` +
            //     `\tw1, w2 = ${w1}, ${w2}\n` +
            //     `\tp01, p02 = ${p10}, ${p20}\n` +
            //     `\tp11, p12 = ${p11}, ${p21}\n` +
            //     `\tfw = ${fw}\n`);
            // console.log(`r=${r} (z), reldt=${relativeDt}`);
            rp12 = 2 * relativeDt;
        }

        // if (Math.abs(rp12) < 1e-7) rp12 = 0;

        if (rp12 === 0)
        {
            if (debug) console.log('Zero-collision.');
        }

        // console.log('deg 1 ' + (b2-b1) + ', ' + (fw*w1x + fw*w2x+p10x-p20x));
        return rp12;
    }

    static solveLeapfrogPostCollision(
        island,
        newSubIsland,
        terrain, // entityIdsInIslandWhichNeedTerrainPostSolving,
        oxAxis, entities, relativeDt, mapCollidingPossible)
    {
        let islandLength = island.length;
        // let newSubIslandLength = newSubIsland.length;
        // let terrainLength = terrain.length;

        // Solve in newSubIsland x island\newSubIsland
        for (let i = 0; i < islandLength; ++i)
        {
            let xIndexI = island[i];
            let id1 = oxAxis[xIndexI].id; let e1 = entities[id1];
            let p10 = e1.p0; let p10x = p10[0]; let p10y = p10[1]; let p10z = p10[2];
            let p11 = e1.p1; let p11x = p11[0]; let p11y = p11[1]; let p11z = p11[2];
            let p1adh = e1.adherence; let p1v0 = e1.v0; let p1a0 = e1.a0; let p1n0 = e1.nu;
            let w1x = e1.widthX; let w1y = e1.widthY; let w1z = e1.widthZ;
            let ltd1 = e1.dtr;

            for (let j = i + 1; j < islandLength; ++j)
            {
                let xIndexJ = island[j];

                let newSubIslandIndexI = newSubIsland.indexOf(xIndexI);
                let newSubIslandIndexJ = newSubIsland.indexOf(xIndexJ);
                let iInNewSubIsland = newSubIslandIndexI < 0;
                let jInNewSubIsland = newSubIslandIndexJ < 0;

                // TODO [HIGH] check my elementary set theory abilities
                let goOn = !iInNewSubIsland && jInNewSubIsland;
                if (!goOn) {
                    // Also solve in island x entityIdsInIslandWhichNeedTerrainPostSolving\{currentInIsland}
                    let terrainHasCurrentIndex = terrain.indexOf(xIndexJ);
                    let jInTerrainResolver = terrainHasCurrentIndex < 0;
                    if (!jInTerrainResolver)
                        continue;
                }

                let id2 = oxAxis[xIndexJ].id;
                let e2 = entities[id2];
                let p20 = e2.p0; let p20x = p20[0]; let p20y = p20[1]; let p20z = p20[2];
                let p21 = e2.p1; let p21x = p21[0]; let p21y = p21[1]; let p21z = p21[2];
                let p2adh = e2.adherence; let p2v0 = e2.v0; let p2a0 = e2.a0; let p2n0 = e2.nu;
                let w2x = e2.widthX; let w2y = e2.widthY; let w2z = e2.widthZ;
                let ltd2 = e2.dtr;

                let x0l = p10x + w1x <= p20x - w2x; let y0l = p10y + w1y <= p20y - w2y; let z0l = p10z + w1z <= p20z - w2z;
                let x1l = p11x + w1x <= p21x - w2x; let y1l = p11y + w1y <= p21y - w2y; let z1l = p11z + w1z <= p21z - w2z;
                let x0r = p10x - w1x >= p20x + w2x; let y0r = p10y - w1y >= p20y + w2y; let z0r = p10z - w1z >= p20z + w2z;
                let x1r = p11x - w1x >= p21x + w2x; let y1r = p11y - w1y >= p21y + w2y; let z1r = p11z - w1z >= p21z + w2z;
                if (x0l && x1l || x0r && x1r || y0l && y1l || y0r && y1r || z0l && z1l || z0r && z1r) continue;
                let xl = x0l && !x1l;  let yl = y0l && !y1l;  let zl = z0l && !z1l;
                let xm = !x0l && !x0r; let ym = !y0l && !y0r; let zm = !z0l && !z0r;
                let xw = !x1l && !x1r; let yw = !y1l && !y1r; let zw = !z1l && !z1r;
                if (xm && ym && zm) {
                    console.log('[Phase III - PostCollision] Full 3D clip clipped.');
                    continue;
                }
                if (!xm + !ym + !zm !== 1) {
                    console.log('[Phase III - PostCollision] Corner 2D clip detected.');
                }
                if (!(xw && yw && zw)) continue;
                let rrel = relativeDt;
                let axis = 'none';
                if (!xm) {
                    let fw = xl ? 1 : -1; let adh10 = p1adh[0]; let adh11 = p1adh[3]; let a1 = ltd1 * ltd1 * .5 * p1a0[0];
                    if (p10x <= p11x && adh11 || p10x >= p11x && adh10) a1 = 0; let adh20 = p2adh[0]; let adh21 = p2adh[3];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[0]; if (p20x <= p21x && adh21 || p20x >= p21x && adh20) a2 = 0;
                    let b1 = ltd1 * (p1v0[0] + p1n0[0]); let b2 = ltd2 * (p2v0[0] + p2n0[0]);
                    let r = RigidBodiesPhase3.solveSecondOrder(a1, a2, b1, b2, p10x, p20x, p11x, p21x, w1x, w2x, fw, relativeDt);
                    if (r >= 0 && r < rrel) { axis = 'x'; rrel = r; }
                }
                if (!ym) {
                    let fw = yl ? 1 : -1; let adh10 = p1adh[1]; let adh11 = p1adh[4]; let a1 = ltd1 * ltd1 * .5 * p1a0[1];
                    if (p10y <= p11y && adh11 || p10y >= p11y && adh10) a1 = 0; let adh20 = p2adh[1]; let adh21 = p2adh[4];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[1]; if (p20y <= p21y && adh21 || p20y >= p21y && adh20) a2 = 0;
                    let b1 = ltd1 * (p1v0[1] + p1n0[1]); let b2 = ltd2 * (p2v0[1] + p2n0[1]);
                    let r = RigidBodiesPhase3.solveSecondOrder(a1, a2, b1, b2, p10y, p20y, p11y, p21y, w1y, w2y, fw, relativeDt);
                    // if (abs(r) < 1e-7) r = 0;
                    if (r >= 0 && r < rrel) { axis = 'y'; rrel = r; }
                }
                if (!zm) {
                    let fw = zl ? 1 : -1; let adh10 = p1adh[2]; let adh11 = p1adh[5]; let a1 = ltd1 * ltd1 * .5 * p1a0[2];
                    if (p10z <= p11z && adh11 || p10z >= p11z && adh10) a1 = 0; let adh20 = p2adh[2]; let adh21 = p2adh[5];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[2]; if (p20z <= p21z && adh21 || p20z >= p21z && adh20) a2 = 0;
                    let b1 = ltd1 * (p1v0[2] + p1n0[2]); let b2 = ltd2 * (p2v0[2] + p2n0[2]);
                    let r = RigidBodiesPhase3.solveSecondOrder(a1, a2, b1, b2, p10z, p20z, p11z, p21z, w1z, w2z, fw, relativeDt);
                    if (r >= 0 && r < rrel) { axis = 'z'; rrel = r;
                    }
                }
                if (rrel < relativeDt) {
                    mapCollidingPossible.push([i, j, rrel, axis]);
                }
            }
        }
    }

    static solveLeapfrogQuadratic(
        island,
        oxAxis,
        entities,
        relativeDt,
        mapCollidingPossible)
    {
        // let abs = Math.abs;
        let nbI = island.length;

        for (let i = 0; i < nbI; ++i) {
            let xIndex1 = island[i];
            // let lfa1 = leapfrogArray[xIndex1];
            let id1 = oxAxis[xIndex1].id;
            let e1 = entities[id1];
            let p10 = e1.p0;
            let p10x = p10[0];
            let p10y = p10[1];
            let p10z = p10[2];
            let p11 = e1.p1;
            let p11x = p11[0];
            let p11y = p11[1];
            let p11z = p11[2];
            let p1adh = e1.adherence;
            //e1.p2 = [p11x, p11y, p11z];
            //let p1_2 = e1.p2;
            let p1v0 = e1.v0;
            let p1a0 = e1.a0;
            let p1n0 = e1.nu;
            let w1x = e1.widthX; let w1y = e1.widthY; let w1z = e1.widthZ;
            let ltd1 = e1.dtr; // this.getTimeDilatation(worldId, p1_0[0], p1_0[1], p1_0[2]);
            // const dta1 = absoluteDt * ltd1;
            // const dtr1 = relativeDt * ltd1;

            for (let j = i + 1; j < nbI; ++j) {
                let xIndex2 = island[j];
                //let lfa2 = leapfrogArray[xIndex2];
                let id2 = oxAxis[xIndex2].id;
                let e2 = entities[id2];
                let p20 = e2.p0;
                let p20x = p20[0];
                let p20y = p20[1];
                let p20z = p20[2];
                let p21 = e2.p1;
                let p21x = p21[0];
                let p21y = p21[1];
                let p21z = p21[2];
                let p2adh = e2.adherence;
                //e2.p2 = [p21x, p21y, p21z];
                //let p2_2 = e2.p2;
                let p2v0 = e2.v0;
                let p2a0 = e2.a0;
                let p2n0 = e2.nu;
                let w2x = e2.widthX;
                let w2y = e2.widthY;
                let w2z = e2.widthZ;
                let ltd2 = e2.dtr; // this.getTimeDilatation(worldId, p2_0[0], p2_0[1], p2_0[2]);
                // TODO [OPT] verify integration with time dilatation.
                // const dta2 = absoluteDt * ltd2;
                // const dtr2 = relativeDt * ltd2;

                //for (let k = 0; k < 3; ++k) {
                //con-st cxm =
                let x0l = p10x + w1x <= p20x - w2x; let y0l = p10y + w1y <= p20y - w2y; let z0l = p10z + w1z <= p20z - w2z;
                let x1l = p11x + w1x <= p21x - w2x; let y1l = p11y + w1y <= p21y - w2y; let z1l = p11z + w1z <= p21z - w2z;
                let x0r = p10x - w1x >= p20x + w2x; let y0r = p10y - w1y >= p20y + w2y; let z0r = p10z - w1z >= p20z + w2z;
                let x1r = p11x - w1x >= p21x + w2x; let y1r = p11y - w1y >= p21y + w2y; let z1r = p11z - w1z >= p21z + w2z;

                if (x0l && x1l || x0r && x1r || y0l && y1l || y0r && y1r || z0l && z1l || z0r && z1r)
                {
                    // console.log('Nope. ' + [x0l, x1l, x0r, x1r, y0l, y1l, y0r, y1r, z0l, z1l, z0r, z1r]);
                    // console.log('\t' + (p11x+w1x) + ',' + (p21x-w2x));
                    continue;
                }

                let xl = x0l && !x1l;  let yl = y0l && !y1l;  let zl = z0l && !z1l;
                // let xr = x0r && !x1r;  let yr = y0r && !y1r;  let zr = z0r && !z1r;
                let xm = !x0l && !x0r; let ym = !y0l && !y0r; let zm = !z0l && !z0r;
                let xw = !x1l && !x1r; let yw = !y1l && !y1r; let zw = !z1l && !z1r;

                if (xm && ym && zm) {
                    console.log('[Phase III - PreCollision] Full 3D clip clipped.');
                    // mapCollidingPossible.push([i, j, 0]);
                    continue;
                }

                if (!xm + !ym + !zm !== 1) {
                    console.log('[Phase III - PreCollision] Corner 2D clip detected.');
                }

                //if ((xl || xr || xm) && (yl || yr || ym) && (zl || zr || zm)) {
                if (!(xw && yw && zw)) continue;

                // if (xw && yw && zw) {
                // TODO [] push into colliding pairs
                // console.log('Collision');
                //let min_dtr1 = dtr1;
                //let min_dtr2 = dtr2;
                let rrel = relativeDt;
                let axis = 'none';

                // Quadratic solve thrice
                if (!xm) {
                    //console.log('colx');
                    let fw = xl ? 1 : -1;

                    let adh10 = p1adh[0];
                    let adh11 = p1adh[3];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[0];
                    if (p10x <= p11x && adh11 || p10x >= p11x && adh10) a1 = 0;

                    let adh20 = p2adh[0];
                    let adh21 = p2adh[3];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[0];
                    if (p20x <= p21x && adh21 || p20x >= p21x && adh20) a2 = 0;

                    //console.log('a1/2 ' + a1 + ', ' + a2 + ', adh ' + p1_adh + ' ; ' + p2_adh);

                    let b1 = ltd1 * (p1v0[0] + p1n0[0]);
                    let b2 = ltd2 * (p2v0[0] + p2n0[0]);

                    // TODO [CRIT] solve same for leapfrog version.
                    let r = RigidBodiesPhase3.solveSecondOrder(
                        a1, a2, b1, b2, p10x, p20x, p11x, p21x, w1x, w2x, fw, relativeDt);

                    //console.log('r=' + r + ' (x), reldt=' + relativeDt);

                    if (r >= 0 && r < rrel) {
                        //min_dtr1 = r * ltd1;
                        //min_dtr2 = r * ltd2;
                        axis = 'x';
                        rrel = r;
                        // if () {
                        // }
                    }
                }

                if (!ym) {
                    //console.log('coly');
                    let fw = yl ? 1 : -1;

                    let adh10 = p1adh[1];
                    let adh11 = p1adh[4];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[1];
                    if (p10y <= p11y && adh11 || p10y >= p11y && adh10) a1 = 0;

                    let adh20 = p2adh[1];
                    let adh21 = p2adh[4];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[1];
                    if (p20y <= p21y && adh21 || p20y >= p21y && adh20) a2 = 0;

                    //console.log('a1/2 ' + a1 + ', ' + a2 + ', adh ' + p1_adh + ' ; ' + p2_adh);

                    let b1 = ltd1 * (p1v0[1] + p1n0[1]);
                    let b2 = ltd2 * (p2v0[1] + p2n0[1]);

                    // TODO [Refactor] extract method.
                    let r = RigidBodiesPhase3.solveSecondOrder(
                        a1, a2, b1, b2, p10y, p20y, p11y, p21y, w1y, w2y, fw, relativeDt);

                    //console.log('r=' + r + ' (y), reldt=' + relativeDt);

                    // if (abs(r) < 1e-7) r = 0;
                    if (r >= 0 && r < rrel) {
                        //let ndtr1 = r * ltd1;
                        //if (ndtr1 < min_dtr1) min_dtr1 = ndtr1;
                        //let ndtr2 = r * ltd2;
                        //if (ndtr2 < min_dtr2) min_dtr2 = ndtr2;
                        //rrel = r;
                        axis = 'y';
                        rrel = r;
                        // if (r < rrel) {
                        // }
                    }
                }

                if (!zm) {
                    //console.log('colz');
                    let fw = zl ? 1 : -1;

                    let adh10 = p1adh[2]; let adh11 = p1adh[5];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[2];
                    if (p10z <= p11z && adh11 || p10z >= p11z && adh10) a1 = 0;

                    let adh20 = p2adh[2]; let adh21 = p2adh[5];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[2];
                    if (p20z <= p21z && adh21 || p20z >= p21z && adh20) a2 = 0;

                    //console.log('a1/2 ' + a1 + ', ' + a2 + ', adh ' + p1_adh + ' ; ' + p2_adh);

                    let b1 = ltd1 * (p1v0[2] + p1n0[2]);
                    let b2 = ltd2 * (p2v0[2] + p2n0[2]);

                    // TODO [Refactor] extract method.
                    let r = RigidBodiesPhase3.solveSecondOrder(
                        a1, a2, b1, b2, p10z, p20z, p11z, p21z, w1z, w2z, fw, relativeDt);

                    //console.log('r=' + r + ' (z), reldt=' + relativeDt);

                    if (r >= 0 && r < rrel) {
                        //let ndtr1 = r * ltd1;
                        //if (ndtr1 < min_dtr1) min_dtr1 = ndtr1;
                        //let ndtr2 = r * ltd2;
                        //if (ndtr2 < min_dtr2) min_dtr2 = ndtr2;
                        axis = 'z';
                        rrel = r;
                        // if (r < rrel) {
                        // }
                        //if (rrel < 0) rrel = r;
                    }
                }

                //if (min_dtr1 < dtr1 || min_dtr2 < dtr2)
                if (rrel < relativeDt) {
                    //e1.copyP01();
                    //e2.copyP01();
                    mapCollidingPossible.push([i, j, rrel, axis]);
                }
            }
        }
    }

    static getSubIsland(
        islandIndex,
        axis,
        objectIndexInIslandToSubIslandXIndex,
        objectIndexInIslandToSubIslandYIndex,
        objectIndexInIslandToSubIslandZIndex,
        subIslandsX,
        subIslandsY,
        subIslandsZ)
    {
        let subIslandIndex = -1;
        switch (axis) {
            case 'x':
                subIslandIndex = objectIndexInIslandToSubIslandXIndex[islandIndex];
                if (subIslandIndex === -1) return null;
                return subIslandsX[subIslandIndex];
            case 'y':
                subIslandIndex = objectIndexInIslandToSubIslandYIndex[islandIndex];
                if (subIslandIndex === -1) return null;
                return subIslandsY[subIslandIndex];
            case 'z':
                subIslandIndex = objectIndexInIslandToSubIslandZIndex[islandIndex];
                if (subIslandIndex === -1) return null;
                return subIslandsZ[subIslandIndex];
            default: console.log('[SubIsland] Undefined axis.'); return null;
        }
    }

    static mergeSubIslands(
        indexI,
        indexJ,
        subIslandI,
        subIslandJ,
        objectIndexInIslandToSubIslandXIndex,
        objectIndexInIslandToSubIslandYIndex,
        objectIndexInIslandToSubIslandZIndex,
        subIslandsX,
        subIslandsY,
        subIslandsZ,
        axis)
    {
        if (axis !== 'x' && axis !== 'y' && axis !== 'z') {
            console.log('Undefined axis.'); return;
        }

        let toSubIslandIndex = null;
        let subIslandArray;
        let newSubIsland;
        switch (axis) {
            case 'x':
                toSubIslandIndex = objectIndexInIslandToSubIslandXIndex;
                subIslandArray = subIslandsX; break;
            case 'y':
                toSubIslandIndex = objectIndexInIslandToSubIslandYIndex;
                subIslandArray = subIslandsY; break;
            case 'z':
                toSubIslandIndex = objectIndexInIslandToSubIslandZIndex;
                subIslandArray = subIslandsZ; break;
            default: break;
        }

        if (subIslandI && subIslandJ) {
            const li = subIslandI.length;
            const lj = subIslandJ.length;
            if (li < lj) {
                newSubIsland = subIslandJ;
                for (let i = li - 1; i >= 0; --i) {
                    let element = subIslandI[i];
                    subIslandJ.push(element);
                    toSubIslandIndex[element] = toSubIslandIndex[indexJ];
                    subIslandI.pop();
                }
            } else {
                newSubIsland = subIslandI;
                for (let j = lj - 1; j >= 0; --j) {
                    let element = subIslandJ[j];
                    subIslandI.push(element);
                    toSubIslandIndex[element] = toSubIslandIndex[indexI];
                    subIslandJ.pop();
                }
            }
        } else if (subIslandI) {
            newSubIsland = subIslandI;
            toSubIslandIndex[indexJ] = toSubIslandIndex[indexI];
            subIslandI.push(indexJ);
        } else if (subIslandJ) {
            newSubIsland = subIslandJ;
            toSubIslandIndex[indexI] = toSubIslandIndex[indexJ];
            subIslandJ.push(indexI);
        } else {
            // Insert new sub island.
            let newId = subIslandArray.length;
            newSubIsland = [indexI, indexJ];
            subIslandArray.push(newSubIsland);
            toSubIslandIndex[indexI] = newId;
            toSubIslandIndex[indexJ] = newId;
        }

        return newSubIsland;
    }

    static applyCollision(
        i, j, r, axis,
        island, oxAxis, entities, relativeDt,
        epsilon)
    {
        let xIndex1 = island[i]; // let lfa1 = leapfrogArray[xIndex1];
        let id1 = oxAxis[xIndex1].id;
        let e1 = entities[id1];
        let p10 = e1.p0;
        let p10x = p10[0];
        let p10y = p10[1];
        let p10z = p10[2];
        let p11 = e1.p1;
        let p11x = p11[0];
        let p11y = p11[1];
        let p11z = p11[2];
        let p1v0 = e1.v0;
        let p1a0 = e1.a0;
        let p1n0 = e1.nu;
        let w1 = [e1.widthX, e1.widthY, e1.widthZ];
        let w1x = w1[0]; let w1y = w1[1]; let w1z = w1[2];
        let ltd1 = e1.dtr;
        let mass1 = e1.mass;
        const sndtr1 = r; // * ltd1;

        let xIndex2 = island[j]; // let lfa2 = leapfrogArray[xIndex2];
        let id2 = oxAxis[xIndex2].id;
        let e2 = entities[id2];
        let p20 = e2.p0;
        let p20x = p20[0];
        let p20y = p20[1];
        let p20z = p20[2];
        let p21 = e2.p1;
        let p21x = p21[0];
        let p21y = p21[1];
        let p21z = p21[2];
        let p2v0 = e2.v0;
        let p2a0 = e2.a0;
        let p2n0 = e2.nu;
        let w2 = [e2.widthX, e2.widthY, e2.widthZ];
        let w2x = w1[0]; let w2y = w1[1]; let w2z = w1[2];
        let ltd2 = e2.dtr;
        let mass2 = e2.mass;
        const sndtr2 = r; // * ltd2;

        // Snap p1.
        let x0l = p10x + w1x <= p20x - w2x; let y0l = p10y + w1y <= p20y - w2y; let z0l = p10z + w1z <= p20z - w2z;
        let x1l = p11x + w1x <= p21x - w2x; let y1l = p11y + w1y <= p21y - w2y; let z1l = p11z + w1z <= p21z - w2z;
        let x0r = p10x - w1x >= p20x + w2x; let y0r = p10y - w1y >= p20y + w2y; let z0r = p10z - w1z >= p20z + w2z;
        let x1r = p11x - w1x >= p21x + w2x; let y1r = p11y - w1y >= p21y + w2y; let z1r = p11z - w1z >= p21z + w2z;

        if (x0l && x1l || x0r && x1r || y0l && y1l || y0r && y1r || z0l && z1l || z0r && z1r)
            return;

        // let xl = x0l && !x1l;  let yl = y0l && !y1l;  let zl = z0l && !z1l;
        // let xr = x0r && !x1r;  let yr = y0r && !y1r;  let zr = z0r && !z1r;
        let xm = !x0l && !x0r; let ym = !y0l && !y0r; let zm = !z0l && !z0r;
        let xw = !x1l && !x1r; let yw = !y1l && !y1r; let zw = !z1l && !z1r;

        if (xm && ym && zm) console.log('[RigidBodies/Solve] two bodies clipped.');
        if (xw && yw && zw) {
            let m2 = [];
            let wm1 = [w1x, w1y, w1z];
            let wm2 = [w2x, w2y, w2z];
            let nep1 = [];
            let nep2 = [];

            let ax = 0;
            switch (axis) {
                case 'x': ax = 0; break;
                case 'y': ax = 1; break;
                case 'z': ax = 2; break;
                default: console.log('Error collision nil error.');
            }
            for (let m = 0; m < 3; ++m) // Account for server congestion / lag with relative dilatation.
            {
                let timestep1;
                let timestep2;
                if (m === ax) {
                    timestep1 = sndtr1;
                    timestep2 = sndtr2;
                } else {
                    timestep1 = ltd1; // TODO dispense re-solving here.
                    timestep2 = ltd2;
                }

                let e1p1i = e1.p1[m];
                let e1p0i = e1.p0[m];
                let e1p1n = e1p0i + (p1v0[m] + p1n0[m]) * timestep1 + .5 * p1a0[m] * timestep1 * timestep1;
                nep1[m] =
                    e1p1i < e1p0i && e1p1n < e1p0i && e1p1i < e1p1n ? // && e1p1n+e < e1p0i && e1p1i < e1p1n+e
                        e1p1n + epsilon :
                        e1p0i < e1p1i && e1p0i < e1p1n && e1p1n < e1p1i ?
                            e1p1n - epsilon : e1p1i;

                let e2p1i = e2.p1[m];
                let e2p0i = e2.p0[m];
                let e2p1n = e2p0i + (p2v0[m] + p2n0[m]) * timestep2 + .5 * p2a0[m] * timestep2 * timestep2;
                nep2[m] =
                    e2p1i < e2p0i && e2p1n < e2p0i && e2p1i < e2p1n ?
                        e2p1n + epsilon :
                        e2p0i < e2p1i && e2p0i < e2p1n && e2p1n < e2p1i ?
                            e2p1n - epsilon : e2p1i;

                m2[m] = nep1[m] + wm1[m] > nep2[m] - wm2[m] && nep1[m] - wm1[m] < nep2[m] + wm2[m];
                // !x1l && !x1r
                // p11x+w1x < p21x-w2x && p11x-w1x > p21x+w2x
                // if (m === ax) {
                //     if (e2p1i < e2p0i && e2.a1[m] < 0 || e2p1i > e2p0i && e2.a1[m] > 0) {
                //         e2.a1[m] = 0;
                        // e2.v1[m] = e1.v1[m];
                        // TODO [HIGH] check that
                        // e2.v1[m] = (mass1 * e1.v1[m] + mass2 * e2.v1[m]) / (mass1 + mass2);
                    // }
                    // if (e1p1i < e1p0i && e1.a1[m] < 0 || e1p1i > e1p0i && e1.a1[m] > 0) {
                    //     e1.a1[m] = 0;
                        // e1.v1[m] = e2.v1[m];
                        // TODO [HIGH] check that
                        // e1.v1[m] = (mass1 * e1.v1[m] + mass2 * e2.v1[m]) / (mass1 + mass2);
                    // }
                // }
            }
            // Temporary security measure.
            // {
            // let l = newSubIsland.length;
            // TODO [HIGH] this is a projection... check collision
            for (let m = 0; m < 3; ++m) {
                e1.p1[m] = nep1[m];
                e2.p1[m] = nep2[m];
            }
            // }
            if (m2[ax]) {
                // console.log('Correction.');
                let e1p0 = e1.p0[ax];
                let e1p1 = e1.p1[ax];
                let e2p0 = e2.p0[ax];
                let e2p1 = e2.p1[ax];
                let e1w = w1[ax];
                let e2w = w2[ax];

                let sgn = Math.sign;
                let e1a1 = e1.a1[ax]; let e1v1 = e1.v1[ax];
                let e2a1 = e2.a1[ax]; let e2v1 = e2.v1[ax];
                let mv = (mass1 * e1v1 + mass2 * e2v1) / (mass1 + mass2);
                let ma = (mass1 * e1a1 + mass2 * e2a1) / (mass1 + mass2);

                if (e1p0 < e2p0) {
                    e1.a1[ax] = sgn(e1v1) !== sgn(e2v1) ? 0 : ma;
                    e2.a1[ax] = sgn(e1v1) !== sgn(e2v1) ? 0 : ma;
                    e1.v1[ax] = mv;
                    e2.v1[ax] = mv;
                    RigidBodiesPhase3.correctCollision(e1, e1p0, e1p1, e1w, e2, e2p0, e2p1, e2w, ax, epsilon);
                } else if (e1p0 > e2p0) {
                    e1.a1[ax] = sgn(e1v1) !== sgn(e2v1) ? 0 : ma;
                    e2.a1[ax] = sgn(e1v1) !== sgn(e2v1) ? 0 : ma;
                    e1.v1[ax] = mv;
                    e2.v1[ax] = mv;
                    RigidBodiesPhase3.correctCollision(e2, e2p0, e2p1, e2w, e1, e1p0, e1p1, e1w, ax, epsilon);
                } else {
                    console.log('[Phase III] - on correction, e1p0 == e2p20; this is worrying.');
                    e1.p1[ax] = e1p0;
                    e2.p1[ax] = e2p0;
                }

                // e1.p1[ax] = e1p0;
                // e2.p1[ax] = e2p0;
            }
        }
    }

    static correctCollision(e1, e1p0, e1p1, e1w, e2, e2p0, e2p1, e2w, ax, epsilon)
    {
        let min = Math.min;
        let max = Math.max;
        let abs = Math.abs;
        let overlap = min(e1p0, e1p1) + e1w + e2w + epsilon;
        if (overlap >= max(e2p0, e2p1)) {
            e1.p1[ax] = e1p0;
            e2.p1[ax] = e2p0;
        } else {
            let d = abs((e1p1 + e1w) - (e2p1 - e2w));
            let projP2 = e2p1 + (d + epsilon) / 2;
            let projP1 = e1p1 - (d + epsilon) / 2;
            // Test sign
            let okProjP1 = (projP1 > min(e1p1, e1p0));
            let okProjP2 = (projP2 < max(e2p0, e2p1));
            if (okProjP1 && okProjP2) {
                e1.p1[ax] = projP1;
                e2.p1[ax] = projP2;
            } else if (okProjP1) {
                let proj2P1 = e1p1 - (d + epsilon);
                if (proj2P1 > min(e1p1, e1p0)) {
                    e1.p1[ax] = proj2P1;
                } else {
                    console.log('[Phase III] - Branching should have been discarded by overlap.');
                    e1.p1[ax] = e1p0;
                }
                e2.p1[ax] = e2p0;
            } else if (okProjP2) {
                let proj2P2 = e2p1 + (d + epsilon);
                if (proj2P2 < max(e2p0, e2p1)) {
                    e2.p1[ax] = proj2P2;
                } else {
                    console.log('[Phase III] - Branching should have been discarded by overlap.');
                    e2.p1[ax] = e2p0;
                }
                e1.p1[ax] = e1p0;
            } else {
                console.log('[Phase III] - Branching here should be prevented by overlap check.');
                e1.p1[ax] = e1p0;
                e2.p1[ax] = e2p0;
            }
        }
    }

}

export default RigidBodiesPhase3;
