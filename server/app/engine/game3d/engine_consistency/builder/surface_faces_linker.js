/**
 * @deprecated
 */

'use strict';

import CSFX from './surface_faces_builder';

class FaceLinker
{
    static flatToCoords(flatId, iS, ijS) {
        const i = flatId % iS;
        const j = (flatId - i) % ijS / iS;
        const k = (flatId - flatId % ijS) / ijS;
        return `${i},${j},${k}`;
    }

    static findN(ci, cj, ck, ci$, cj$, ck$) {
        const deltaI = 1 + ci$ - ci;
        const deltaJ = 1 + cj$ - cj;
        const deltaK = 1 + ck$ - ck;

        const dd = deltaI + 3 * deltaJ + 9 * deltaK;

        // console.log(`finding ${dd}, ${deltaI} + 3 ${deltaJ} + 9 ${deltaK}...`);
        switch (dd) {
            //case 0: 	break;
            case 1:     return 17;
            //case 2: 	break;

            case 3:     return 12;
            case 4:     return 5;
            case 5:     return 10;

            //case 6: 	break;
            case 7:     return 16;
            //case 8: 	break;


            case 9:     return 9;
            case 10:    return 3;
            case 11:    return 8;

            case 12:    return 1;
            //case 13: 	break;
            case 14:    return 0;

            case 15:    return 7;
            case 16:    return 2;
            case 17:    return 6;


            //case 18: 	break;
            case 19:    return 15;
            //case 20:    return 4;

            case 21:    return 13;
            case 22: 	return 4;
            case 23:    return 11;

            //case 24: 	break;
            case 25:    return 14;
            //case 26: 	break;
        }
    }

    // call linkCriterion(flatId, otherFlatId,
    //                      -1 0 1, -1 0 1, -1 0 1,
    //                      chunkI, chunkJ, chunkK capacity, blocks, neighbourBlocks)
    static linkCriterion(
        indexS, indexD,
        deltaI, deltaJ, deltaK,
        ci, cj, ck,
        iS, ijS, capacity,
        blocks, neighbourBlocks)
    {
        const dimI = iS;
        const dimJ = ijS / iS;
        const dimK = capacity / ijS;

        // Extract
        const i = indexS % iS;
        const j = (indexS - i) % ijS / iS;
        const k = (indexS - indexS % ijS) / ijS;

        // Detect and shift
        let i$ = i;
        let j$ = j;
        let k$ = k;
        let ci$ = ci;
        let cj$ = cj;
        let ck$ = ck;

        if (deltaI > 0) {
            if (indexD % iS === 0) { // T1
                ci$ = ci + 1;
                i$ = 0;
            } else i$ = i + 1;
        } else if (deltaI < 0) {
            if (indexD % iS === iS - 1) { // T4
                ci$ = ci - 1;
                i$ = dimI - 1;
            } else i$ = i - 1;
        }

        if (deltaJ > 0) {
            if ((indexD - i$) % ijS === 0) { // T2
                cj$ = cj + 1;
                j$ = 0;
            } else j$ = j + 1;
        } else if (deltaJ < 0) {
            if ((indexD - i$) % ijS === ijS - 1) { // T5
                cj$ = cj - 1;
                j$ = dimJ - 1;
            } else j$ = j - 1;
        }

        if (deltaK > 0) {
            if (indexD >= capacity) { // T3
                ck$ = ck + 1;
                k$ = 0;
            } else k$ = k + 1;
        }  else if (deltaK < 0) { // should never be covered
            if (indexD < 0) { // T6
                ck$ = ck - 1;
                k$ = dimK - 1;
            } else k$ = k - 1;
        }

        // Compute
        const ijk$ = i$ + j$ * iS + k$ * ijS;

        // Locate
        let bs;
        if (ci === ci$ && cj === cj$ && ck === ck$) {
            bs = blocks[ijk$];
        }
        else {
            const n = FaceLinker.findN(ci, cj, ck, ci$, cj$, ck$);
            try {
                bs = neighbourBlocks[n][ijk$];
            } catch (e) {
                throw Error(`Undefined neighbour ${n}`);
            }
            // console.log(indexS + "|" + indexD + " : "
            // +i$+ "," +j$+ "," +k$+ "  " + ijk$ + " | " + n + " | " + bs);
        }

        // Criterion
        return bs === 0;
    }

    static affect(components, id1, id2) {
        if (components[id1] === 0)
            console.log(`Error @affect after link: (id1) ${id1} has 0 component id.`);
        if (components[id2] === 0)
            console.log(`Error @affect after link: (id2) ${id2} has 0 component id.`);

        if (components[id1] < components[id2]) {
            components[id2] = components[id1];
        } else {
            components[id1] = components[id2];
        }
    }

    // TODO [MEDIUM] Z cases verification.
    // TODO [HIGH] manage topology.
    // TODO [HIGH] manage topology client-side.
    /**
     * Neighbours: 0 x+, 1 x-, 2 y+, 3 y-, 4 z+, 5 z-
     */
    static linkI(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck)
    {
        // Lazy termination (prevent id calculations).
        const val = faces[0][flatFaceId];
        if (!val) {
            console.log('WARN. i-* linker was given a faceId which is not present in faces array.');
            return;
        }

        const normalP = val > 0;
        const normalM = val < 0;

        // Working with flat indices (3 arrays of length 'capacity')
        // Working with stacked indices (1 array with [0,capacity[=i, [capacity,2capacity[=j, ...)
        const stackFaceId = flatFaceId;

        // CASE 1: aligned with top and back i (both normals)
        const top = flatFaceId + ijS;
        const ftop = faces[0][top];
        if (top < capacity) {
            if (
                normalP && ftop > 0 ||
                normalM && ftop < 0
            )
            {
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} i linked to top i ${top}`);
                if (ec[top] !== cc[top] && cc[top] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`i, current k: ${cc[top]}, ${cc[stackFaceId]}`);
                    merger.push([cc[top], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, top, stackFaceId);
            }
        }

        const back = flatFaceId + iS;
        const fback = faces[0][back];
        if (back % ijS === flatFaceId % ijS + iS)
        {
            if (
                normalP && fback > 0 ||
                normalM && fback < 0
            )
            {
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} i linked to back i ${back}`);
                if (ec[back] !== cc[back] && cc[back] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`i, current k: ${cc[back]}, ${cc[stackFaceId]}`);
                    merger.push([cc[back], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, back, stackFaceId);
            }
        }

        // CASE 2: orthogonal with CURRENT top and back (j, k)
        const flatTopOrtho = flatFaceId; // k, obviously inbounds POTENTIALLY MERGED
        const ftopo = faces[2][flatTopOrtho];
        if (
            normalP && ftopo > 0 &&
            FaceLinker.linkCriterion(
                flatFaceId, flatFaceId + 1 + ijS,
                1, 0, 1, ci, cj, ck, iS, ijS,
                capacity, blocks, neighbourBlocks) ||
            normalM && ftopo < 0
        )
        {
            const stackTopOrtho = 2 * capacity + flatFaceId;
            if (CSFX.debugLinks)
                console.log(`${stackFaceId} i linked to current k ${stackTopOrtho}`);
            if (ec[stackTopOrtho] !== cc[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId])
            {
                if (CSFX.debugPostMerger)
                    console.log(`i, current k: ${cc[stackTopOrtho]}, ${cc[stackFaceId]}`);
                merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
            }
            FaceLinker.affect(cc, stackTopOrtho, stackFaceId);
        }

        const flatBackOrtho = flatFaceId; // j, obviously inbounds POTENTIALLY MERGED
        const fbacko = faces[1][flatBackOrtho];
        if (
            normalP && fbacko > 0 &&
            FaceLinker.linkCriterion(
                flatFaceId, flatFaceId + 1 + iS,
                1, 1, 0, ci, cj, ck, iS, ijS,
                capacity, blocks, neighbourBlocks) ||
            normalM && fbacko < 0
        )
        {
            const stackBackOrtho = capacity + flatFaceId;
            if (CSFX.debugLinks)
                console.log(`${stackFaceId} i linked to current j ${stackBackOrtho}`);
            if (ec[stackBackOrtho] !== cc[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId])
            {
                if (CSFX.debugPostMerger)
                    console.log(`i, current j: ${cc[stackBackOrtho]}, ${[stackFaceId]}`);
                merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
            }
            FaceLinker.affect(cc, stackBackOrtho, stackFaceId);
        }

        // CASE 3: orthogonal with next top and back (j, k)
        // !!! REVERSE NORMALS !!!
        const flatTopOrthoNext = flatTopOrtho + 1; // k
        if (flatTopOrthoNext % iS === flatTopOrtho % iS + 1) {
            const ftopon = faces[2][flatTopOrthoNext];
            if (
                normalP && ftopon < 0 ||
                normalM && ftopon > 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId + ijS,
                    0, 0, 1, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackTopOrthoNext = 2 * capacity + flatTopOrthoNext;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} i linked to next k ${stackTopOrthoNext}`);
                FaceLinker.affect(cc, stackTopOrthoNext, stackFaceId);
            }
        }

        const flatBackOrthoNext = flatBackOrtho + 1; // j, POTENTIALLY MERGED
        if (flatBackOrthoNext % iS === flatBackOrtho % iS + 1) {
            const fbackon = faces[1][flatBackOrthoNext];
            if (
                normalP && fbackon < 0 ||
                normalM && fbackon > 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId + iS,
                    0, 1, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackBackOrthoNext = capacity + flatBackOrthoNext;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} i linked to next j ${stackBackOrthoNext}`);
                if (ec[stackBackOrthoNext] !== cc[stackBackOrthoNext] && cc[stackBackOrthoNext] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`i, previous j: ${[stackBackOrthoNext]},${cc[stackFaceId]}`);
                    merger.push([cc[stackBackOrthoNext], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrthoNext, stackFaceId);
            }
        }

        // CASE 4: ortho with previous j on next i, regular orientation
        const flatOrthoIJ = flatBackOrthoNext - iS;
        if (flatOrthoIJ > 0 && flatOrthoIJ % iS === (flatBackOrtho - iS) % iS + 1) {
            const foij = faces[1][flatOrthoIJ];
            if (
                normalP && foij > 0 ||
                normalM && foij < 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId - iS,
                    0, -1, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackOrthoIJ = capacity + flatOrthoIJ;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} i linked to previous j ${stackOrthoIJ}`);
                if (ec[stackOrthoIJ] !== cc[stackOrthoIJ] && cc[stackOrthoIJ] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`i, previous j: ${cc[stackOrthoIJ]},${cc[stackFaceId]}`);
                    merger.push([cc[stackOrthoIJ], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackOrthoIJ, stackFaceId);
            }
        }
    }

    static linkJ(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck)
    {
        // Lazy termination (prevent id calculations).
        const val = faces[1][flatFaceId];
        if (!val) {
            console.log('WARN. j-* linker was given a faceId which is not present in faces array.');
            return;
        }

        const normalP = val > 0;
        const normalM = val < 0;

        const stackFaceId = capacity + flatFaceId;

        // CASE 1: aligned with top and right j
        const top = flatFaceId + ijS; // NOT MERGED YET
        if (top < capacity) {
            const ftop = faces[1][top];
            if (
                normalP && ftop > 0 ||
                normalM && ftop < 0
            )
            {
                const stackTop = capacity + top;
                if (CSFX.debugLinks) console.log(`${stackFaceId} j linked to top j ${stackTop}`);
                FaceLinker.affect(cc, stackTop, stackFaceId);
            }
        }

        const right = flatFaceId + 1; // POTENTIALLY MERGED
        if (right % iS === flatFaceId % iS + 1) {
            const fright = faces[1][right];
            if (
                normalP && fright > 0 ||
                normalM && fright < 0
            )
            {
                const stackRight = capacity + right;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} j linked to back j ${stackRight}`);
                if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`j, back j: ${cc[stackRight]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackRight], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRight, stackFaceId);
            }
        }

        // CASE 2: orthogonal with top (k)
        const flatTopOrtho = flatFaceId; // k, obviously inbounds, POTENTIALLY MERGED
        const ftopo = faces[2][flatTopOrtho];
        if (
            normalP && ftopo > 0 &&
            FaceLinker.linkCriterion(
                flatFaceId, flatFaceId + iS + ijS,
                0, 1, 1, ci, cj, ck, iS, ijS,
                capacity, blocks, neighbourBlocks) ||
            normalM && ftopo < 0
        )
        {
            const stackTopOrtho = 2 * capacity + flatFaceId;
            if (CSFX.debugLinks)
                console.log(`${stackFaceId} j linked to current k ${stackTopOrtho}`);
            if (cc[stackTopOrtho] !== ec[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId])
            {
                if (CSFX.debugPostMerger)
                    console.log(`j, current k ${cc[stackTopOrtho]}, ${cc[stackFaceId]}`);
                merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
            }
            FaceLinker.affect(cc, stackTopOrtho, stackFaceId);
        }

        // CASE 3: orthogonal with next k or next i
        // REVERSE ORIENTATION
        const flatTopOrthoNext = flatTopOrtho + iS; // next k, NOT MERGED YET
        if (flatTopOrthoNext % ijS === flatTopOrtho % ijS + iS) {
            const ftopon = faces[2][flatTopOrthoNext];
            if (
                normalP && ftopon < 0 ||
                normalM && ftopon > 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId + ijS,
                    0, 0, 1, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackTopOrthoNext = 2 * capacity + flatTopOrthoNext;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} j linked to next k ${stackTopOrthoNext}`);
                FaceLinker.affect(cc, stackTopOrthoNext, stackFaceId);
            }
        }

        const flatBackOrthoNext = flatFaceId + iS; // next i, POTENTIALLY MERGED
        if (flatBackOrthoNext % ijS === flatFaceId % ijS + iS) {
            const fbackon = faces[0][flatBackOrthoNext];
            if (
                normalP && fbackon < 0 ||
                normalM && fbackon > 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId + 1,
                    1, 0, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackBackOrthoNext = flatFaceId + iS;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} j linked to next i ${stackBackOrthoNext}`);
                if (cc[stackBackOrthoNext] !== ec[stackBackOrthoNext] && cc[stackBackOrthoNext] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`j, current k ${cc[stackBackOrthoNext]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackBackOrthoNext], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrthoNext, stackFaceId);
            }
        }
    }

    static linkK(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks, ci, cj, ck)
    {
        // Lazy termination (prevent id calculations).
        const val = faces[2][flatFaceId];
        if (!val) {
            console.log('WARN. k-* linker was given a faceId which is not present in faces array.');
            console.log(`\tface id: ${flatFaceId}`);
            console.log(`\tvalue: ${val}`);
            return;
        }

        const normalP = val > 0;
        const normalM = val < 0;

        const stackFaceId = 2 * capacity + flatFaceId;

        // CASE 1: aligned with back and right k
        const right = flatFaceId + 1; // right k
        if (right % iS === flatFaceId % iS + 1) { // is it inbounds?
            const fright = faces[2][right];
            if (
                normalP && fright > 0 ||
                normalM && fright < 0
            )
            {
                const stackRight = 2 * capacity + right;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} k linked to right k ${stackRight}`);
                if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`k, right k: ${cc[stackRight]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackRight], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRight, stackFaceId);
            }
        }

        const back = flatFaceId + iS; // back k
        if (back % ijS === flatFaceId % ijS + iS) {
            const fback = faces[2][back];
            if (
                normalP && fback > 0 ||
                normalM && fback < 0
            )
            {
                const stackBack = 2 * capacity + back;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} k linked to back k ${stackBack}`);
                if (cc[stackBack] !== ec[stackBack] && cc[stackBack] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`k, back k: ${cc[stackBack]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackBack], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBack, stackFaceId);
            }
        }

        // CASE 2: orthogonal with (upper current and previous) back and right (j, i)
        // Current -> reverse orientation
        const flatBackOrthoCurrent = flatFaceId + ijS; // j
        if (flatBackOrthoCurrent < capacity) {
            const fbackoc = faces[1][flatBackOrthoCurrent];
            if (
                normalP && fbackoc < 0 ||
                normalM && fbackoc > 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId + iS,
                    0, 1, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackBackOrtho = capacity + flatBackOrthoCurrent;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} k linked to current j ${stackBackOrtho}`);
                if (cc[stackBackOrtho] !== ec[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`k, current j: ${cc[stackBackOrtho]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrtho, stackFaceId);
            }
        }

        const flatRightOrthoCurrent = flatFaceId + ijS; // i
        if (flatRightOrthoCurrent < capacity) {
            const frightoc = faces[0][flatRightOrthoCurrent];
            if (
                normalP && frightoc < 0 ||
                normalM && frightoc > 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId + 1,
                    1, 0, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackRightOrthoCurrent = flatRightOrthoCurrent;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} k linked to current i ${stackRightOrthoCurrent}`);
                if (cc[stackRightOrthoCurrent] !== ec[stackRightOrthoCurrent] &&
                    cc[stackRightOrthoCurrent] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`k, current i: ${cc[stackRightOrthoCurrent]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackRightOrthoCurrent], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRightOrthoCurrent, stackFaceId);
            }
        }

        // Previous -> regular orientation
        const flatBackOrthoPrevious = flatBackOrthoCurrent - iS; // j
        if (flatBackOrthoPrevious < capacity &&
            flatBackOrthoPrevious % ijS === flatBackOrthoCurrent % ijS - iS)
        {
            const fbackop = faces[1][flatBackOrthoPrevious];
            if (
                normalP && fbackop > 0 ||
                normalM && fbackop < 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId - iS,
                    0, -1, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackBackOrthoPrevious = capacity + flatBackOrthoPrevious;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} k linked to previous j ${stackBackOrthoPrevious}`);
                if (cc[stackBackOrthoPrevious] !== ec[stackBackOrthoPrevious] &&
                    cc[stackBackOrthoPrevious] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`k, previous j: ${cc[stackBackOrthoPrevious]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackBackOrthoPrevious], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrthoPrevious, stackFaceId);
            }
        }

        const flatRightOrthoPrevious = flatRightOrthoCurrent - 1; // i
        if (flatRightOrthoPrevious < capacity &&
            flatRightOrthoPrevious % iS === flatRightOrthoCurrent % iS - 1) {
            const frightop = faces[0][flatRightOrthoPrevious];
            if (
                normalP && frightop > 0 ||
                normalM && frightop < 0 &&
                FaceLinker.linkCriterion(
                    flatFaceId, flatFaceId - 1,
                    -1, 0, 0, ci, cj, ck, iS, ijS,
                    capacity, blocks, neighbourBlocks)
            )
            {
                const stackRightOrthoPrevious = flatRightOrthoPrevious;
                if (CSFX.debugLinks)
                    console.log(`${stackFaceId} k linked to previous i ${stackRightOrthoPrevious}`);
                if (cc[stackRightOrthoPrevious] !== ec[stackRightOrthoPrevious] &&
                    cc[stackRightOrthoPrevious] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger)
                        console.log(`k, previous i: ${cc[stackRightOrthoPrevious]}, ${cc[stackFaceId]}`);
                    merger.push([cc[stackRightOrthoPrevious], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRightOrthoPrevious, stackFaceId);
            }
        }
    }
}

export default FaceLinker;
