/**
 * Island solving.
 */

class RigidBodiesPhase3
{
    static solveBabylon(a, b, c, sup)
    {
        if (a === 0) {
            if (b === 0)
                return sup;
            else
                return -c / b;
        }
        let delta = b * b - 4 * a * c;
        if (delta > 0) {
            const sd = Math.sqrt(delta);
            const r1 = (-b - sd) / (2 * a);
            const r2 = (-b + sd) / (2 * a);
            if (r1 >= 0 && r2 >= 0)
                return Math.min(r1, r2);
            else if (r1 >= 0 || r2 >= 0)
                return Math.max(Math.max(r1, r2), 0);
            else
                return sup;
        } else if (delta === 0) {
            // if (debug) console.log('delta = 0');
            if (a === 0)
                return sup;
            else
                return -b / (2 * a);
        }
        return 0;
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
        let dbg = false; // TODO [LOW] solve the farther entity problem.

        let rp1 = RigidBodiesPhase3.solveBabylon(a1, b1, p10 - p11, 2 * relativeDt);
        if (p10 < p11 && a1 * relativeDt * relativeDt + b1 * relativeDt + p10 < p11 ||
            p10 > p11 && p11 < a1 * relativeDt * relativeDt + b1 * relativeDt + p10)
        {
            if (dbg) console.log(`[SecondOrder] Farther entity (1): ${rp1} | from ` +
                `${a1 * relativeDt * relativeDt + b1 * relativeDt + p10} to ${p11}.`);
        }

        // Check for snapping on second trajectory.
        let rp2 = RigidBodiesPhase3.solveBabylon(a2, b2, p20 - p21, 2 * relativeDt);
        if (p20 < p21 && a2 * relativeDt * relativeDt + b2 * relativeDt + p20 < p21 ||
            p20 > p21 && p21 < a2 * relativeDt * relativeDt + b2 * relativeDt + p20)
        {
            if (dbg) console.log(`[SecondOrder] Farther entity (2): ${rp2} | from ` +
                `${a2 * relativeDt * relativeDt + b2 * relativeDt + p20} to ${p21}.`);
        }

        // Solve free 2-collision.
        let rp12 = RigidBodiesPhase3.solveBabylon(a1 - a2, b1 - b2, fw * w1 + fw * w2 + p10 - p20, 2 * relativeDt); //, true);
        // let rp12 = 2 * relativeDt;
        // if (a1 !== a2)
        // else if (b1 !== b2)
        //     rp12 = (fw * w1 + fw * w2 + p10 - p20) / (b2 - b1);
        if (rp12 === 0)
        {
            if (dbg) console.log('[SecondOrder] Unlikely zero output from babylon solver...');
        }

        // Both trajectories should not be snapped at the same time.
        if (rp12 > rp1 && relativeDt > rp1 && rp12 > rp2 && relativeDt > rp2) {
            // console.log('Two colliding bodies saw their trajectory snapped on the same axis... Think about it.');
        }

        // In case of (1)-snap.
        if ((rp12 > rp1 || rp12 < 0) && relativeDt > rp1 && rp1 >= 0) {
            // Solve constrained (1)-end-of-line collision.
            let rp3 = RigidBodiesPhase3.solveBabylon(a2, b2, -fw * w1 - fw * w2 + p20 - p11, 2 * relativeDt);
            // console.log(`Constrained (1): ${rp3} | ${rp12}`);
            if ((rp12 < 0 || rp12 > rp3) && rp3 >= 0) rp12 = rp3;
            if (rp3 > relativeDt) rp12 = 0;
        }

        // In case of (2)-snap.
        if ((rp12 > rp2 || rp12 < 0) && relativeDt > rp2 && rp2 >= 0) {
            // Solve constrained (2)-end-of-line collision.
            let rp4 = RigidBodiesPhase3.solveBabylon(a1, b1, fw * w1 + fw * w2 + p10 - p21, 2 * relativeDt);
            // console.log(`Constrained (2): ${rp4} | ${rp12}`);
            if ((rp12 < 0 || rp12 > rp4) && rp4 >= 0) rp12 = rp4;
            if (rp4 > relativeDt) rp12 = 0;
        }

        if (rp12 < 0 || rp12 >= relativeDt) {
            if (dbg) {
                console.log('r computation error');
                console.log(`\tb1, b2 = ${b1}, ${b2}\n` +
                    `\tw1, w2 = ${w1}, ${w2}\n` +
                    `\tp01, p02 = ${p10}, ${p20}\n` +
                    `\tp11, p12 = ${p11}, ${p21}\n` +
                    `\tfw = ${fw}\n`);
                console.log(`r=${rp12} (z), reldt=${relativeDt}`);
            }
            rp12 = 2 * relativeDt;
        }

        // if (Math.abs(rp12) < 1e-7) rp12 = 0;

        if (rp12 === 0)
        {
            if (dbg) console.log('[SecondOrder] Zero-collision.');
        }

        if (dbg) {
            // console.log('deg 1 ' + (b2-b1) + ', ' + (fw*w1x + fw*w2x+p10x-p20x));
            console.log(rp12);
        }

        return rp12;
    }

    static solveLeapfrogPostCollision(
        island,
        newSubIsland,
        entityIdsInIslandWhichNeedTerrainPostSolving,
        oxAxis, entities, relativeDt, mapCollidingPossible)
    {
        let islandLength = island.length;
        // let newSubIslandLength = newSubIsland.length;

        // Solve in newSubIsland x island\newSubIsland
        for (let i = 0; i < islandLength; ++i)
        {
            let xIndexI = island[i];
            let id1 = oxAxis[xIndexI].id; let e1 = entities[id1];
            let p10 = e1.p0; let p10x = p10[0]; let p10y = p10[1]; let p10z = p10[2];
            let p11 = e1.p1; let p11x = p11[0]; let p11y = p11[1]; let p11z = p11[2];
            let p1adh = e1.adherence; let p1v0 = e1.v0; let p1a0 = e1.a0; let p1n0 = e1.nu1;
            let w1x = e1.widthX; let w1y = e1.widthY; let w1z = e1.widthZ;
            let ltd1 = e1.dtr;

            let newSubIslandIndexI = newSubIsland.indexOf(i);
            let iInNewSubIsland = newSubIslandIndexI > -1;

            for (let j = i + 1; j < islandLength; ++j)
            {
                let xIndexJ = island[j];

                let newSubIslandIndexJ = newSubIsland.indexOf(j);
                let jInNewSubIsland = newSubIslandIndexJ > -1;

                // does this work as expected?
                let goOn = !iInNewSubIsland && jInNewSubIsland ||
                            iInNewSubIsland && !jInNewSubIsland;
                if (!goOn) {
                    // Also solve in island x entityIdsInIslandWhichNeedTerrainPostSolving\{currentInIsland}
                }

                let id2 = oxAxis[xIndexJ].id;
                let e2 = entities[id2];
                let p20 = e2.p0; let p20x = p20[0]; let p20y = p20[1]; let p20z = p20[2];
                let p21 = e2.p1; let p21x = p21[0]; let p21y = p21[1]; let p21z = p21[2];
                let p2adh = e2.adherence; let p2v0 = e2.v0; let p2a0 = e2.a0; let p2n0 = e2.nu1;
                let w2x = e2.widthX; let w2y = e2.widthY; let w2z = e2.widthZ;
                let ltd2 = e2.dtr;
                let debugFlag =  false;
                if (debugFlag)
                    console.log(`\t\t\tTesting ${e1.entityId} vs ${e2.entityId}...`);

                let x0l = p10x + w1x <= p20x - w2x; let y0l = p10y + w1y <= p20y - w2y; let z0l = p10z + w1z <= p20z - w2z;
                let x1l = p11x + w1x <= p21x - w2x; let y1l = p11y + w1y <= p21y - w2y; let z1l = p11z + w1z <= p21z - w2z;
                let x0r = p10x - w1x >= p20x + w2x; let y0r = p10y - w1y >= p20y + w2y; let z0r = p10z - w1z >= p20z + w2z;
                let x1r = p11x - w1x >= p21x + w2x; let y1r = p11y - w1y >= p21y + w2y; let z1r = p11z - w1z >= p21z + w2z;
                if (x0l && x1l || x0r && x1r || y0l && y1l || y0r && y1r || z0l && z1l || z0r && z1r) continue;
                let xl = x0l && !x1l;  let yl = y0l && !y1l;  let zl = z0l && !z1l;
                let xm = !x0l && !x0r; let ym = !y0l && !y0r; let zm = !z0l && !z0r;
                let xw = !x1l && !x1r; let yw = !y1l && !y1r; let zw = !z1l && !z1r;

                if (xm && ym && zm) {
                    console.warn('[Phase III - PostCollision] Full 3D clip detected.');
                    continue;
                }
                if (!xm + !ym + !zm !== 1) {
                    console.warn('[Phase III - PostCollision] Corner 2D clip detected.');
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
                    let fw = zl ? 1 : -1; let adh10 = p1adh[2]; let adh11 = p1adh[5];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[2];
                    if (p10z <= p11z && adh11 || p10z >= p11z && adh10) a1 = 0; let adh20 = p2adh[2]; let adh21 = p2adh[5];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[2]; if (p20z <= p21z && adh21 || p20z >= p21z && adh20) a2 = 0;
                    let b1 = ltd1 * (p1v0[2] + p1n0[2]); let b2 = ltd2 * (p2v0[2] + p2n0[2]);
                    let r = RigidBodiesPhase3.solveSecondOrder(a1, a2, b1, b2, p10z, p20z, p11z, p21z, w1z, w2z, fw, relativeDt);
                    if (r >= 0 && r < rrel) { axis = 'z'; rrel = r;
                    }
                }
                if (debugFlag)
                    console.log(`\t\t\t\tGot ${rrel}`);
                if (rrel < relativeDt) {
                    if (debugFlag)
                        console.log(`\t\tRe-solving ${e1.entityId} vs ${e2.entityId} -> t = ${rrel}`);
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
        const nbI = island.length;

        for (let i = 0; i < nbI; ++i)
        {
            let xIndex1 = island[i];
            // let lfa1 = leapfrogArray[xIndex1];
            let id1 = oxAxis[xIndex1].id;
            let e1 = entities[id1];
            let p10 = e1.p0;
            const p10x = p10[0]; const p10y = p10[1]; const p10z = p10[2];
            let p11 = e1.p1;
            const p11x = p11[0]; const p11y = p11[1]; const p11z = p11[2];
            let p1adh = e1.adherence;
            //e1.p2 = [p11x, p11y, p11z];
            //let p1_2 = e1.p2;
            let p1v0 = e1.v0;
            let p1a0 = e1.a0;
            let p1n0 = e1.nu1;
            const w1x = e1.widthX; const w1y = e1.widthY; const w1z = e1.widthZ;
            const ltd1 = e1.dtr; // this.getTimeDilation(worldId, p1_0[0], p1_0[1], p1_0[2]);
            // const dta1 = absoluteDt * ltd1;
            // const dtr1 = relativeDt * ltd1;

            for (let j = i + 1; j < nbI; ++j) {
                let xIndex2 = island[j];
                //let lfa2 = leapfrogArray[xIndex2];
                let id2 = oxAxis[xIndex2].id;
                let e2 = entities[id2];
                let p20 = e2.p0;
                const p20x = p20[0]; const p20y = p20[1]; const p20z = p20[2];
                let p21 = e2.p1;
                const p21x = p21[0]; const p21y = p21[1]; const p21z = p21[2];
                let p2adh = e2.adherence;
                //e2.p2 = [p21x, p21y, p21z];
                //let p2_2 = e2.p2;
                let p2v0 = e2.v0;
                let p2a0 = e2.a0;
                let p2n0 = e2.nu1;
                const w2x = e2.widthX; const w2y = e2.widthY; const w2z = e2.widthZ;
                const ltd2 = e2.dtr; // this.getTimeDilation(worldId, p2_0[0], p2_0[1], p2_0[2]);
                // TODO [OPT] verify integration with time dilation.
                // const dta2 = absoluteDt * ltd2;
                // const dtr2 = relativeDt * ltd2;

                //for (let k = 0; k < 3; ++k) {
                //con-st cxm =
                const x0l = p10x + w1x <= p20x - w2x; const y0l = p10y + w1y <= p20y - w2y; const z0l = p10z + w1z <= p20z - w2z;
                const x1l = p11x + w1x <= p21x - w2x; const y1l = p11y + w1y <= p21y - w2y; const z1l = p11z + w1z <= p21z - w2z;
                const x0r = p10x - w1x >= p20x + w2x; const y0r = p10y - w1y >= p20y + w2y; const z0r = p10z - w1z >= p20z + w2z;
                const x1r = p11x - w1x >= p21x + w2x; const y1r = p11y - w1y >= p21y + w2y; const z1r = p11z - w1z >= p21z + w2z;

                if (x0l && x1l || x0r && x1r || y0l && y1l || y0r && y1r || z0l && z1l || z0r && z1r)
                {
                    // console.log('\tNope. ' + [x0l, x1l, x0r, x1r, y0l, y1l, y0r, y1r, z0l, z1l, z0r, z1r]);
                    // console.log('\t' + (p11x + w1x) + ',' + (p21x - w2x));
                    continue;
                }

                const xl = x0l && !x1l;  const yl = y0l && !y1l;  const zl = z0l && !z1l;
                // const xr = x0r && !x1r;  const yr = y0r && !y1r;  const zr = z0r && !z1r;
                const xm = !x0l && !x0r; const ym = !y0l && !y0r; const zm = !z0l && !z0r;
                const xw = !x1l && !x1r; const yw = !y1l && !y1r; const zw = !z1l && !z1r;

                const debugCollision = false;
                // TODO [CRIT] reset this debug flag
                if (xm && ym && zm) {
                    if (debugCollision) console.log('[Phase III - PreCollision] Full 3D clip detected.');
                    // mapCollidingPossible.push([i, j, 0]);
                    continue;
                }

                if (!xm + !ym + !zm !== 1) {
                    console.log('[Phase III - PreCollision] Corner 2D clip detected.');
                }

                //if ((xl || xr || xm) && (yl || yr || ym) && (zl || zr || zm)) {
                if (!(xw && yw && zw)) {
                    // console.log('xw yw zw misfit');
                    continue;
                }

                // if (xw && yw && zw) {
                // console.log('Collision');
                //let min_dtr1 = dtr1;
                //let min_dtr2 = dtr2;
                let rrel = relativeDt;
                let axis = 'none';

                // Quadratic solve thrice
                if (!xm) {
                    //console.log('colx');
                    const fw = xl ? 1 : -1;

                    const adh10 = p1adh[0];
                    const adh11 = p1adh[3];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[0];
                    if (p10x <= p11x && adh11 || p10x >= p11x && adh10) a1 = 0;

                    const adh20 = p2adh[0];
                    const adh21 = p2adh[3];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[0];
                    if (p20x <= p21x && adh21 || p20x >= p21x && adh20) a2 = 0;

                    //console.log('a1/2 ' + a1 + ', ' + a2 + ', adh ' + p1_adh + ' ; ' + p2_adh);

                    const b1 = ltd1 * (p1v0[0] + p1n0[0]);
                    const b2 = ltd2 * (p2v0[0] + p2n0[0]);

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
                    const fw = yl ? 1 : -1;

                    const adh10 = p1adh[1];
                    const adh11 = p1adh[4];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[1];
                    if (p10y <= p11y && adh11 || p10y >= p11y && adh10) a1 = 0;

                    const adh20 = p2adh[1];
                    const adh21 = p2adh[4];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[1];
                    if (p20y <= p21y && adh21 || p20y >= p21y && adh20) a2 = 0;

                    //console.log('a1/2 ' + a1 + ', ' + a2 + ', adh ' + p1_adh + ' ; ' + p2_adh);

                    const b1 = ltd1 * (p1v0[1] + p1n0[1]);
                    const b2 = ltd2 * (p2v0[1] + p2n0[1]);

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
                    const fw = zl ? 1 : -1;

                    const adh10 = p1adh[2]; const adh11 = p1adh[5];
                    let a1 = ltd1 * ltd1 * .5 * p1a0[2];
                    if (p10z <= p11z && adh11 || p10z >= p11z && adh10) a1 = 0;

                    const adh20 = p2adh[2]; const adh21 = p2adh[5];
                    let a2 = ltd2 * ltd2 * .5 * p2a0[2];
                    if (p20z <= p21z && adh21 || p20z >= p21z && adh20) a2 = 0;

                    //console.log('a1/2 ' + a1 + ', ' + a2 + ', adh ' + p1_adh + ' ; ' + p2_adh);

                    const b1 = ltd1 * (p1v0[2] + p1n0[2]);
                    const b2 = ltd2 * (p2v0[2] + p2n0[2]);

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

                // console.log('\tcomputed t=' + rrel + ' on ' + xm + ', ' + ym + ', ' + zm);
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
                return subIslandIndex === -1 ? null : subIslandsX[subIslandIndex];
            case 'y':
                subIslandIndex = objectIndexInIslandToSubIslandYIndex[islandIndex];
                return subIslandIndex === -1 ? null : subIslandsY[subIslandIndex];
            case 'z':
                subIslandIndex = objectIndexInIslandToSubIslandZIndex[islandIndex];
                return subIslandIndex === -1 ? null : subIslandsZ[subIslandIndex];
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
            const newId = subIslandArray.length;
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
        let p10 = e1.p0; const p10x = p10[0]; const p10y = p10[1]; const p10z = p10[2];
        let p11 = e1.p1; const p11x = p11[0]; const p11y = p11[1]; const p11z = p11[2];
        let p1v0 = e1.v0; let p1v1 = e1.v1;
        let p1a0 = e1.a0; let p1a1 = e1.a1;
        let p1n0 = e1.nu1;
        const w1x = e1.widthX; const w1y = e1.widthY; const w1z = e1.widthZ;
        let ltd1 = e1.dtr;
        const sndtr1 = r; // * ltd1;

        let xIndex2 = island[j]; // let lfa2 = leapfrogArray[xIndex2];
        let id2 = oxAxis[xIndex2].id;
        let e2 = entities[id2];
        let p20 = e2.p0; const p20x = p20[0]; const p20y = p20[1]; const p20z = p20[2];
        let p21 = e2.p1; const p21x = p21[0]; const p21y = p21[1]; const p21z = p21[2];
        let p2v0 = e2.v0; let p2v1 = e2.v1;
        let p2a0 = e2.a0; let p2a1 = e2.a1;
        let p2n0 = e2.nu1;
        const w2x = e2.widthX; const w2y = e2.widthY; const w2z = e2.widthZ;
        const ltd2 = e2.dtr;
        const sndtr2 = r; // * ltd2;

        // Snap p1.
        const x0l = p10x + w1x <= p20x - w2x; const y0l = p10y + w1y <= p20y - w2y; const z0l = p10z + w1z <= p20z - w2z;
        const x1l = p11x + w1x <= p21x - w2x; const y1l = p11y + w1y <= p21y - w2y; const z1l = p11z + w1z <= p21z - w2z;
        const x0r = p10x - w1x >= p20x + w2x; const y0r = p10y - w1y >= p20y + w2y; const z0r = p10z - w1z >= p20z + w2z;
        const x1r = p11x - w1x >= p21x + w2x; const y1r = p11y - w1y >= p21y + w2y; const z1r = p11z - w1z >= p21z + w2z;

        if (x0l && x1l || x0r && x1r || y0l && y1l || y0r && y1r || z0l && z1l || z0r && z1r)
        {
            // Nothing to collide.
            return;
        }

        // const xl = x0l && !x1l;  const yl = y0l && !y1l;  const zl = z0l && !z1l;
        // const xr = x0r && !x1r;  const yr = y0r && !y1r;  const zr = z0r && !z1r;
        const xm = !x0l && !x0r; const ym = !y0l && !y0r; const zm = !z0l && !z0r;
        const xw = !x1l && !x1r; const yw = !y1l && !y1r; const zw = !z1l && !z1r;

        if (xm && ym && zm) console.warn('[RigidBodies/Solve] two bodies clipped.');
        if (xw && yw && zw) {
            let m2 = [];
            let wm1 = [w1x, w1y, w1z];
            let wm2 = [w2x, w2y, w2z];
            let nep1 = [];
            let nep2 = [];

            let ax = axis === 'x' ? 0 : axis === 'y' ? 1 : axis === 'z' ? 2 : -1;
            if (ax < 0) {
                console.error('[Phase III] Invalid axis.');
                return;
            }

            for (let m = 0; m < 3; ++m) // Account for server congestion / lag with relative dilation.
            {
                if (m !== ax) continue;

                let timestep1;
                let timestep2;
                if (m === ax) {
                    timestep1 = sndtr1;
                    timestep2 = sndtr2;
                } else {
                    timestep1 = ltd1; // TODO dispense re-solving here.
                    timestep2 = ltd2;
                }

                const gamma = epsilon;

                const e1p1i = p11[m];
                const e1p0i = p10[m];
                const e1p1n = e1p0i + (p1v0[m] + p1n0[m]) * timestep1 + .5 * p1a0[m] * timestep1 * timestep1;
                nep1[m] =
                    e1p1i < e1p0i && e1p1n < e1p0i && e1p1i < e1p1n ? // && e1p1n+e < e1p0i && e1p1i < e1p1n+e
                        e1p1n + gamma :
                        e1p0i < e1p1i && e1p0i < e1p1n && e1p1n < e1p1i ?
                            e1p1n - gamma : e1p1i;

                const e2p1i = p21[m];
                const e2p0i = p20[m];
                const e2p1n = e2p0i + (p2v0[m] + p2n0[m]) * timestep2 + .5 * p2a0[m] * timestep2 * timestep2;
                nep2[m] =
                    e2p1i < e2p0i && e2p1n < e2p0i && e2p1i < e2p1n ?
                        e2p1n + gamma :
                        e2p0i < e2p1i && e2p0i < e2p1n && e2p1n < e2p1i ?
                            e2p1n - gamma : e2p1i;

                if (e1p1i <= e1p0i && (nep1[m] < e1p1i || nep1[m] > e1p0i) ||
                    e1p0i <= e1p1i && (nep1[m] > e1p1i || nep1[m] < e1p0i))
                    nep1[m] = e1p0i;

                if (e2p1i <= e2p0i && (nep2[m] < e2p1i || nep2[m] > e2p0i) ||
                    e2p0i <= e2p1i && (nep2[m] > e2p1i || nep2[m] < e2p0i))
                    nep2[m] = e2p0i;

                // // Forward E1
                // if (e1p0i <= e1p1n && e1p1n <= e1p1i && e1p0i < e2p0i) {
                //     const e2p1n2 = e1p1n + w1[m] + w2[m] + gamma;
                //     if (e2p1n2 > max(e2p0i, e2p1i)) {
                //         // TODO [LOW] possible to do better than e2p1n - gamma
                //         const e1p1n2 = e2p1n - w1[m] - w2[m] - gamma;
                //         if (e1p1n2 < min(e1p0i, e1p1i))
                //             nep1[m] = e1p0i;
                //         else
                //             nep1[m] = e1p1n2;
                //         nep2[m] = e2p1n;
                //     } else {
                //         nep1[m] = e1p1n;
                //         nep2[m] = e2p1n2;
                //     }
                // } else if (e1p0i <= e1p1n && e1p1n <= e1p1i && e2p0i < e1p0i) {
                //     const e1p1n2 = e2p1n + w1[m] + w2[m] + gamma;
                //     if (e1p1n2 > max(e1p0i, e1p1i)) {
                //         const e2p1n2 = e2p1n - w1[m] - w2[m] - gamma;
                //         if (e2p1n2 < min(e2p0i, e2p1i))
                //             nep2[m] = e2p0i;
                //         else
                //             nep2[m] = e2p1n2;
                //         nep1[m] = e1p1n;
                //     } else {
                //         nep2[m] = e2p1n;
                //         nep1[m] = e1p1n2;
                //     }
                // }
                // // Backwards E1
                // else if (e1p1i <= e1p1n && e1p1n <= e1p0i && e1p0i < e2p0i) {
                //     const e2p1n2 = e1p1n + w1[m] + w2[m] + gamma;
                //     if (e2p1n2 > max(e2p0i, e2p1i)) {
                //         // TODO [LOW] possible to do better than e2p1n - gamma
                //         const e1p1n2 = e2p1n - w1[m] - w2[m] - gamma;
                //         if (e1p1n2 < min(e1p0i, e1p1i))
                //             nep1[m] = e1p0i;
                //         else
                //             nep1[m] = e1p1n2;
                //         nep2[m] = e2p1n;
                //     } else {
                //         nep1[m] = e1p1n;
                //         nep2[m] = e2p1n2;
                //     }
                // } else if (e1p1i <= e1p1n && e1p1n <= e1p0i && e2p0i < e1p0i) {
                //     const e1p1n2 = e2p1n + w1[m] + w2[m] + gamma;
                //     if (e1p1n2 > max(e1p0i, e1p1i)) {
                //         const e2p1n2 = e2p1n - w1[m] - w2[m] - gamma;
                //         if (e2p1n2 < min(e2p0i, e2p1i))
                //             nep2[m] = e2p0i;
                //         else
                //             nep2[m] = e2p1n2;
                //         nep1[m] = e1p1n;
                //     } else {
                //         nep2[m] = e2p1n;
                //         nep1[m] = e1p1n2;
                //     }
                // }

                //const eeps = 1e-30; // beware of numerical errors here
                m2[m] = nep1[m] + wm1[m] + epsilon / 2.0 > nep2[m] - wm2[m] - epsilon / 2.0 &&
                        nep1[m] - wm1[m] - epsilon / 2.0 < nep2[m] + wm2[m] + epsilon / 2.0;
                // !x1l && !x1r
                // p11x+w1x < p21x-w2x && p11x-w1x > p21x+w2x
                // if (m === ax) {
                //     if (e2p1i < e2p0i && e2.a1[m] < 0 || e2p1i > e2p0i && e2.a1[m] > 0) {
                //         e2.a1[m] = 0;
                //         e2.v1[m] = e1.v1[m];
                //         TODO [HIGH] check that
                //         e2.v1[m] = (mass1 * e1.v1[m] + mass2 * e2.v1[m]) / (mass1 + mass2);
                //     }
                //     if (e1p1i < e1p0i && e1.a1[m] < 0 || e1p1i > e1p0i && e1.a1[m] > 0) {
                //         e1.a1[m] = 0;
                //         e1.v1[m] = e2.v1[m];
                //         TODO [HIGH] check that
                //         e1.v1[m] = (mass1 * e1.v1[m] + mass2 * e2.v1[m]) / (mass1 + mass2);
                //     }
                // }
            }
            // Temporary security measure.
            // {
            // const l = newSubIsland.length;
            // TODO [HIGH] this is a projection... check collision

            // TODO [CRIT] verify this lastR mechanism
            // e1.lastR = r;
            // e2.lastR = r;

            for (let m = 0; m < 3; ++m) {
                if (m !== ax) continue;
                // Check terrain...
                const e1p1 = p11[m]; const e2p1 = p21[m];
                const e1p0 = p10[m]; const e2p0 = p20[m];
                const ne1p1 = nep1[m]; const ne2p1 = nep2[m];
                if (e1p0 < e1p1 && ne1p1 < e1p1 || e1p0 > e1p1 && ne1p1 > e1p1)
                    p11[m] = nep1[m];
                if (e2p0 < e2p1 && ne2p1 < e2p1 || e2p0 > e2p1 && ne2p1 > e2p1)
                    p21[m] = nep2[m];
            }
            // }

            let collidedbg = false;
            if (collidedbg) console.log('collide?');
            let abs = Math.abs;
            let e1a1 = e1.a1[ax]; let e1v1 = e1.v1[ax];
            let e2a1 = e2.a1[ax]; let e2v1 = e2.v1[ax];
            let mv = abs(e1v1) < abs(e2v1) ? e1v1 : e2v1; // min(, e2v1); // (mass1 * e1v1 + mass2 * e2v1) / (mass1 + mass2);
            let ma = abs(e1a1) < abs(e2a1) ? e1a1 : e2a1; // min(e1a1, e2a1); // (mass1 * e1a1 + mass2 * e2a1) / (mass1 + mass2);
            if (collidedbg) console.log(`${e1v1} | ${e2v1}`);
            p1v1[ax] = mv;
            p2v1[ax] = mv;

            if (m2[ax]) {
                if (collidedbg) console.log('\tyes!');
                // console.log('Correction.');
                const e1p0 = p10[ax];
                const e1p1 = p11[ax];
                const e2p0 = p20[ax];
                const e2p1 = p21[ax];
                const e1w = axis === 'x' ? w1x : axis === 'y' ? w1y : /* axis === 'z' ? */ w1z;
                const e2w = axis === 'x' ? w2x : axis === 'y' ? w2y : /* axis === 'z' ? */ w2z;

                let sgn = Math.sign;
                if (e1p0 < e2p0) {
                    p1a1[ax] = sgn(e1v1) !== sgn(e2v1) ? 0 : ma;
                    p2a1[ax] = p1a1[ax];
                    RigidBodiesPhase3.correctCollision(e1, e1p0, e1p1, e1w, e2, e2p0, e2p1, e2w, ax, epsilon);
                } else if (e1p0 > e2p0) {
                    p1a1[ax] = sgn(e1v1) !== sgn(e2v1) ? 0 : ma;
                    p2a1[ax] = p1a1[ax];
                    RigidBodiesPhase3.correctCollision(e2, e2p0, e2p1, e2w, e1, e1p0, e1p1, e1w, ax, epsilon);
                } else {
                    console.log('[Phase III] - on correction, e1p0 == e2p0; this is worrying.');
                    p11[ax] = e1p0;
                    p21[ax] = e2p0;
                }

                // TODO [CRIT] reset if collision stability problems.
                // e1.p1[ax] = e1p0;
                // e2.p1[ax] = e2p0;
            }

            const debug = false;
            if (debug) {
                console.log(`\tz = ${e1.p0[2]} -> ${e1.p1[2]} , ${e2.p0[2]} -> ${e2.p1[2]}`);
            }
        }
    }

    // We have that e1p0 < e2p0.
    static correctCollision(e1, e1p0, e1p1, e1w, e2, e2p0, e2p1, e2w, ax, epsilon)
    {
        let seps = 1e-6;
        let min = Math.min;
        let max = Math.max;
        let overlap = min(e1p0, e1p1) + e1w + e2w + epsilon + seps;
        if (overlap >= max(e2p0, e2p1)) {
            e1.p1[ax] = e1p0;
            e2.p1[ax] = e2p0;
        } else {
            let den = e1p1 - e1p0 - e2p1 + e2p0;
            if (den === 0) {
                e1.p1[ax] = e1p0;
                e2.p1[ax] = e2p0;
                return;
            }
            let alpha = e1p1 - e1p0;
            let beta  = e2p1 - e2p0;
            let num = e2p0 - e1p0 - e1w - e2w - epsilon - seps;
            let e1t = e1p0 + (num / den) * alpha;
            let e2t = e2p0 + (num / den) * beta;

            // console.log('[Phase III]\t\t\t\t' + e1t + ', ' + e2t);
            if (e1t <= max(e1p0, e1p1) && e1t >= min(e1p0, e1p1) &&
                e2t <= max(e2p0, e2p1) && e2t >= min(e2p0, e1p1) &&
                e1t + e1w + e2w + epsilon + seps <= e2t)
            {
                e1.p1[ax] = e1t;
                e2.p1[ax] = e2t;
            } else {
                e1.p1[ax] = e1p0;
                e2.p1[ax] = e2p0;
            }

            // let d = abs((e1p1 + e1w) - (e2p1 - e2w));
            // let projP2 = e2p1 + (d + epsilon) / 2;
            // let projP1 = e1p1 - (d + epsilon) / 2;
            // // Test sign
            // let okProjP1 = (projP1 >= min(e1p1, e1p0));
            // let okProjP2 = (projP2 <= max(e2p0, e2p1));
            // if (okProjP1 && okProjP2) {
            //     e1.p1[ax] = projP1;
            //     e2.p1[ax] = projP2;
            // } else if (okProjP1) {
            //     let proj2P1 = e1p1 - (d + epsilon);
            //     if (proj2P1 > min(e1p1, e1p0)) {
            //         e1.p1[ax] = proj2P1;
            //     } else {
            //         if (debg) console.log('[Phase III] - Branching [projP1] should have been discarded by overlap.');
            //         e1.p1[ax] = e1p0;
            //     }
            //     e2.p1[ax] = e2p0;
            // } else if (okProjP2) {
            //     let proj2P2 = e2p1 + (d + epsilon);
            //     if (proj2P2 < max(e2p0, e2p1)) {
            //         e2.p1[ax] = proj2P2;
            //     } else {
            //         if (debg) console.log('[Phase III] - Branching [projP2] should have been discarded by overlap.');
            //         e2.p1[ax] = e2p0;
            //     }
            //     e1.p1[ax] = e1p0;
            // } else {
            //     if (debg) console.log('[Phase III] - Branching [noProj] should be prevented by overlap check.');
            //     e1.p1[ax] = e1p0;
            //     e2.p1[ax] = e2p0;
            // }
        }
    }
}

export default RigidBodiesPhase3;
