/**
 * Island solving.
 */

class RigidBodiesPhase3 {

    static solveSecondOrder(
        a1, a2,
        b1, b2,
        p10, p20,
        p11, p21, // Unnecessary
        w1, w2,
        fw, relativeDt)
    {
        let abs = Math.abs;
        let sqrt = Math.sqrt;
        let r = 0;

        if (a1 !== a2) {
            //console.log('deg2');
            let delta = (b1 - b2) * (b1 - b2) - 4 * (a1 - a2) * (fw * w1 + fw * w2 + p10 - p20);
            if (delta > 0) {
                console.log('delta > 0');
                let r1 = (b2 - b1 + sqrt(delta)) / (2 * (a1 - a2));
                let r2 = (b2 - b1 - sqrt(delta)) / (2 * (a1 - a2));
                r = Math.min(Math.max(r1, 0), Math.max(r2, 0));
            } else if (delta === 0) {
                console.log('delta = 0');
                r = (b2 - b1) / (2 * (a1 - a2));
            }
        }
        else if (b1 !== b2)
        {
            if (abs(b2 - b1) < 1e-7) r = 0;
            else r = (fw * w1 + fw * w2 + p10 - p20) / (b2 - b1);

            if (r < 0 || r >= relativeDt) {
                console.log('r computation error');
                console.log(`\tb1, b2 = ${b1}, ${b2}\n` +
                    `\tw1, w2 = ${w1}, ${w2}\n` +
                    `\tp01, p02 = ${p10}, ${p20}\n` +
                    `\tp11, p12 = ${p11}, ${p21}\n` +
                    `\tfw = ${fw}\n`);
                console.log(`r=${r} (z), reldt=${relativeDt}`);
                r = 0;
            }
            // console.log('deg 1 ' + (b2-b1) + ', ' + (fw*w1x + fw*w2x+p10x-p20x));
        }
        return r;
    }

    static solveLeapfrogQuadratic(
        island,
        oxAxis,
        entities,
        relativeDt,
        mapCollidingPossible)
    {
        let abs = Math.abs;
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
                //const cxm =
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
                    console.log('[RigidBodies/ComputeIslands] Full 3D clip clipped.');
                    // mapCollidingPossible.push([i, j, 0]);
                    continue;
                }

                if (!xm + !ym + !zm !== 1) {
                    console.log('[RigidBodies/ComputeIslands] Corner 2D clip detected.');
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

                    if (abs(r) < 1e-7) r = 0;
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
        i, j, r, axis, newSubIsland,
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
        let w1x = e1.widthX;
        let w1y = e1.widthY;
        let w1z = e1.widthZ;
        let ltd1 = e1.dtr;
        const sndtr1 = r * relativeDt; // * ltd1;

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
        let w2x = e2.widthX; let w2y = e2.widthY; let w2z = e2.widthZ;
        let ltd2 = e2.dtr;
        const sndtr2 = r * relativeDt; // * ltd2;

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
                    e1p1i < e1p0i && e1p1n < e1p0i && e1p1i < e1p1n ?
                        e1p1n - epsilon :
                        e1p0i < e1p1i && e1p0i < e1p1n && e1p1n < e1p1i ?
                            e1p1n + epsilon : e1p1i;

                let e2p1i = e2.p1[m];
                let e2p0i = e2.p0[m];
                let e2p1n = e2p0i + (p2v0[m] + p2n0[m]) * timestep2 + .5 * p2a0[m] * timestep2 * timestep2;
                nep2[m] = e2p1i < e2p0i && e2p1n < e2p0i && e2p1i < e2p1n ?
                    e2p1n - epsilon :
                    e2p0i < e2p1i && e2p0i < e2p1n && e2p1n < e2p1i ?
                        e2p1n + epsilon : e2p1i;

                m2[m] = nep1[m] + wm1[m] > nep2[m] - wm2[m] && nep1[m] - wm1[m] < nep2[m] + wm2[m];
                // !x1l && !x1r
                // p11x+w1x < p21x-w2x && p11x-w1x > p21x+w2x
                if (m === ax) {
                    if (e2p1i < e2p0i && e2.a1[m] < 0 || e2p1i > e2p0i && e2.a1[m] > 0) {
                        e2.a1[m] = 0;
                        e2.v1[m] = e1.v1[m];
                    }
                    if (e1p1i < e1p0i && e1.a1[m] < 0 || e1p1i > e1p0i && e1.a1[m] > 0) {
                        e1.a1[m] = 0;
                        e1.v1[m] = e2.v1[m];
                    }
                }
            }
            // Temporary security measure.
            // {
            // let l = newSubIsland.length;
            for (let m = 0; m < 3; ++m) {
                e1.p1[m] = nep1[m];
                e2.p1[m] = nep2[m];
            }
            // }
            if (m2[ax]) {
                e1.p1[ax] = e1.p0[ax];
                e2.p1[ax] = e2.p0[ax];
            }
        }
    }

}

export default RigidBodiesPhase3;
