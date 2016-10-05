/**
 *
 */

'use strict';

import CSFX from './chunkfacex';

class FaceLinker {

    static notBoundary(iS, ijS, capacity, index) {
        //return index%iS !== 0 && index%ijS !== 0; && index < capacity && index >= 0;
        // TODO access other chunks for limit cases
        return true;
    }
    
    static affect(components, id1, id2) {
        if (components[id1] === 0) console.log("Error @affect after link: (id1) " + id1 + " has 0 component id.");
        if (components[id2] === 0) console.log("Error @affect after link: (id2) " + id2 + " has 0 component id.");

        //if (components[id1] === 38) console.log('id1 ' + id1 + ' ' + components[id1] + ' <- ' + components[id2] + ' (' + id2 + ')');
        //if (components[id2] === 38) console.log('id1 ' + id1 + ' ' + components[id1] + ' <- ' + components[id2] + ' (' + id2 + ')');

        //if (id1 === 2779) console.log('id1 ' + id1 + ' ' + components[id1] + ' <- ' + components[id2] + ' (' + id2 + ')');
        //if (id2 === 2779) console.log('id1 ' + id1 + ' ' + components[id1] + ' <- ' + components[id2] + ' (' + id2 + ')');

        if (components[id1] < components[id2]) {
            components[id2] = components[id1];
        } else {
            components[id1] = components[id2];
        }
    }
    
    // TODO access neighbours
    /**
     * Neighbours: 0 x+, 1 x-, 2 y+, 3 y-, to be zeefied (4 z+, 5 z-)
     */
    static linkI(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks) {

        // Lazy termination (prevent id calculations).
        const val = faces[0][flatFaceId];
        if (!val) {
            console.log("WARN. i-* linker was given a faceId which is not present in faces array.");
            return;
        }

        const normalP = val > 0;
        const normalM = val < 0;

        // Working with flat indices (3 arrays of length 'capacity')
        // Working with stacked indices (1 array with [0,capacity[=i, [capacity,2capacity[=j, ...)
        const stackFaceId = flatFaceId;

        // CASE 1: aligned with top and back i (both normals)
        const top = flatFaceId + ijS;
        if (top < capacity) {
            if (
                normalP && faces[0][top] > 0 ||
                normalM && faces[0][top] < 0
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + " i linked to top i " + top);
                if (ec[top] !== cc[top] && cc[top] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('i, current k: ' + cc[top] + ', ' + cc[stackFaceId]);
                    merger.push([cc[top], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, top, stackFaceId);
            }
        }

        const back = flatFaceId + iS;
        if (back % ijS === (flatFaceId % ijS) + iS) {
            if (
                normalP && faces[0][back] > 0 ||
                normalM && faces[0][back] < 0
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + " i linked to back i " + back);
                if (ec[back] !== cc[back] && cc[back] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('i, current k: ' + cc[back] + ', ' + cc[stackFaceId]);
                    merger.push([cc[back], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, back, stackFaceId);
            }
        }

        // CASE 2: orthogonal with CURRENT top and back (j, k)
        const flatTopOrtho = flatFaceId; // k, obviously inbounds POTENTIALLY MERGED
        const stackTopOrtho = 2 * capacity + flatFaceId;
        if (
                normalP && faces[2][flatTopOrtho] > 0 &&
                (
                    FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+1+ijS) ?
                    blocks[flatFaceId+1+ijS] === 0 :
                    false // TODO zeefy, refine on double edges
                    // neighbourBlocks[4][(flatFaceId+1)%ijS] === 0
                )
                ||
                normalM && faces[2][flatTopOrtho] < 0
            )
        {
            if (CSFX.debugLinks) console.log(stackFaceId + ' i linked to current k ' + stackTopOrtho);
            if (ec[stackTopOrtho] !== cc[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId])
            {
                if (CSFX.debugPostMerger) console.log('i, current k: ' + cc[stackTopOrtho] + ', ' + cc[stackFaceId]);
                merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
            }
            FaceLinker.affect(cc, stackTopOrtho, stackFaceId);
        }

        const flatBackOrtho = flatFaceId; // j, obviously inbounds POTENTIALLY MERGED
        const stackBackOrtho = capacity + flatFaceId;
        if (
                normalP && faces[1][flatBackOrtho] > 0 &&
                (
                    FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+1+iS) ?
                    blocks[flatFaceId+1+iS] === 0 :
                    false // TODO zeefy, refine on double edges
                )
                ||
                normalM && faces[1][flatBackOrtho] < 0
            )
        {
            if (CSFX.debugLinks) console.log(stackFaceId + ' i linked to current j ' + stackBackOrtho);
            if (ec[stackBackOrtho] !== cc[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId])
            {
                if (CSFX.debugPostMerger) console.log('i, current j: ' + cc[stackBackOrtho] + ', ' + cc[stackFaceId]);
                merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
            }
            FaceLinker.affect(cc, stackBackOrtho, stackFaceId);
        }

        // CASE 3: orthogonal with next top and back (j, k)
        // !!! REVERSE NORMALS !!!
        const flatTopOrthoNext = flatTopOrtho + 1; // k
        if (flatTopOrthoNext % iS === (flatTopOrtho % iS) + 1) {
            const stackTopOrthoNext = 2 * capacity + flatTopOrthoNext;
            if (
                    normalP && faces[2][flatTopOrthoNext] < 0
                    ||
                    normalM && faces[2][flatTopOrthoNext] > 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+ijS) ?
                        blocks[flatFaceId+ijS] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' i linked to next k ' + stackTopOrthoNext);
                FaceLinker.affect(cc, stackTopOrthoNext, stackFaceId);
            }
        }

        const flatBackOrthoNext = flatBackOrtho + 1; // j
        if (flatBackOrthoNext % iS === (flatBackOrtho % iS) + 1) {
            const stackBackOrthoNext = capacity + flatBackOrthoNext;
            if (
                    normalP && faces[1][flatBackOrthoNext] < 0
                    ||
                    normalM && faces[1][flatBackOrthoNext] > 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+iS) ?
                        blocks[flatFaceId+iS] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' i linked to next j ' + stackBackOrthoNext);
                FaceLinker.affect(cc, stackBackOrthoNext, stackFaceId);
            }
        }

        // CASE 4: ortho with previous j on next i, regular orientation
        const flatOrthoIJ = flatBackOrthoNext - iS;
        if (flatOrthoIJ > 0 && flatOrthoIJ % iS === (flatBackOrtho - iS)%iS + 1) {
            const stackOrthoIJ = capacity + flatOrthoIJ;
            if (
                    normalP && faces[1][flatOrthoIJ] > 0
                    ||
                    normalM && faces[1][flatOrthoIJ] < 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId-iS) ?
                        blocks[flatFaceId-iS] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' i linked to previous j ' + stackOrthoIJ);
                if (ec[stackOrthoIJ] !== cc[stackOrthoIJ] && cc[stackOrthoIJ] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('i, previous j: ' + cc[stackOrthoIJ] + ',' + cc[stackFaceId]);
                    merger.push([cc[stackOrthoIJ], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackOrthoIJ, stackFaceId);
            }
        }
    }

    static linkJ(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks) {

        // Lazy termination (prevent id calculations).
        const val = faces[1][flatFaceId];
        if (!val) {
            console.log("WARN. j-* linker was given a faceId which is not present in faces array.");
            return;
        }

        const normalP = val > 0;
        const normalM = val < 0;

        const stackFaceId = capacity + flatFaceId;

        // CASE 1: aligned with top and right j
        const top = flatFaceId + ijS; // NOT MERGED YET
        if (top < capacity) {
            const stackTop = capacity + top;
            if (
                normalP && faces[1][top] > 0 ||
                normalM && faces[1][top] < 0
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' j linked to top j ' + stackTop);
                FaceLinker.affect(cc, stackTop, stackFaceId);
            }
        }

        const right = flatFaceId + 1; // POTENTIALLY MERGED
        if (right % iS === (flatFaceId % iS) + 1) {
            const stackRight = capacity + right;
            if (
                normalP && faces[1][right] > 0 ||
                normalM && faces[1][right] < 0
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' j linked to back j ' + stackRight);
                if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('j, back j: ' + cc[stackRight] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackRight], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRight, stackFaceId);
            }
        }

        // CASE 2: orthogonal with top (k)
        const flatTopOrtho = flatFaceId; // k, obviously inbounds, POTENTIALLY MERGED
        const stackTopOrtho = 2*capacity + flatFaceId;
        if (
                normalP && faces[2][flatTopOrtho] > 0 &&
                (
                    FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+iS+ijS) ?
                    blocks[flatFaceId+iS+ijS] === 0 :
                    false // TODO zeefy, refine on double edges
                )
                ||
                normalM && faces[2][flatTopOrtho] < 0
            )
        {
            if (CSFX.debugLinks) console.log(stackFaceId + ' j linked to current k ' + stackTopOrtho);
            if (cc[stackTopOrtho] !== ec[stackTopOrtho] && cc[stackTopOrtho] !== cc[stackFaceId])
            {
                if (CSFX.debugPostMerger) console.log('j, current k ' + cc[stackTopOrtho] + ', ' + cc[stackFaceId]);
                merger.push([cc[stackTopOrtho], cc[stackFaceId]]);
            }
            FaceLinker.affect(cc, stackTopOrtho, stackFaceId);
        }

        // CASE 3: orthogonal with next k or next i
        // REVERSE ORIENTATION
        const flatTopOrthoNext = flatTopOrtho + iS; // next k, NOT MERGED YET
        if (flatTopOrthoNext % ijS === (flatTopOrtho % ijS) + iS) {
            const stackTopOrthoNext = 2*capacity + flatTopOrthoNext;
            if (
                    normalP && faces[2][flatTopOrthoNext] < 0
                    ||
                    normalM && faces[2][flatTopOrthoNext] > 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+ijS) ?
                        blocks[flatFaceId+ijS] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' j linked to next k ' + stackTopOrthoNext);
                FaceLinker.affect(cc, stackTopOrthoNext, stackFaceId);
            }
        }

        const flatBackOrthoNext = flatFaceId + iS; // next i
        if (flatBackOrthoNext % ijS === (flatFaceId % ijS) + iS) {
            const stackBackOrthoNext = flatFaceId + iS;
            if (
                    normalP && faces[0][flatBackOrthoNext] < 0
                    ||
                    normalM && faces[0][flatBackOrthoNext] > 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+1) ?
                        blocks[flatFaceId+1] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' j linked to next i ' + stackBackOrthoNext);
                FaceLinker.affect(cc, stackBackOrthoNext, stackFaceId);
            }
        }
    }

    static linkK(flatFaceId, cc, ec, faces, merger, capacity, iS, ijS, blocks, neighbourBlocks) {

        // Lazy termination (prevent id calculations).
        const val = faces[2][flatFaceId];
        if (!val) {
            console.log("WARN. k-* linker was given a faceId which is not present in faces array.");
            console.log('\tface id: ' + flatFaceId);
            console.log('\tvalue: ' + val);
            return;
        }

        const normalP = val > 0;
        const normalM = val < 0;

        const stackFaceId = 2*capacity + flatFaceId;

        // CASE 1: aligned with back and right k
        const right = flatFaceId + 1; // right k
        if (right % iS === (flatFaceId % iS) + 1) { // is it inbounds?
            const stackRight = 2 * capacity + right;
            if (
                normalP && faces[2][right] > 0 ||
                normalM && faces[2][right] < 0
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' k linked to right k ' + stackRight);
                if (cc[stackRight] !== ec[stackRight] && cc[stackRight] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('k, right k: ' + cc[stackRight] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackRight], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRight, stackFaceId);
            }
        }

        const back = flatFaceId + iS; // back k
        if (back % ijS === (flatFaceId % ijS) + iS) {
            const stackBack = 2 * capacity + back;
            if (
                normalP && faces[2][back] > 0 ||
                normalM && faces[2][back] < 0
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' k linked to back k ' + stackBack);
                if (cc[stackBack] !== ec[stackBack] && cc[stackBack] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('k, back k: ' + cc[stackBack] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackBack], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBack, stackFaceId);
            }
        }

        // CASE 2: orthogonal with (upper current and previous) back and right (j, i)
        // Current -> reverse orientation
        const flatBackOrthoCurrent = flatFaceId + ijS; // j
        if (flatBackOrthoCurrent < capacity) {
            const stackBackOrtho = capacity + flatBackOrthoCurrent;
            if (
                    normalP && faces[1][flatBackOrthoCurrent] < 0
                    ||
                    normalM && faces[1][flatBackOrthoCurrent] > 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+iS) ?
                        blocks[flatFaceId+iS] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' k linked to current j ' + stackBackOrtho);
                if (cc[stackBackOrtho] !== ec[stackBackOrtho] && cc[stackBackOrtho] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('k, current j: ' + cc[stackBackOrtho] + ', ' +cc[stackFaceId]);
                    merger.push([cc[stackBackOrtho], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrtho, stackFaceId);
            }
        }

        const flatRightOrthoCurrent = flatFaceId + ijS; // i
        if (flatRightOrthoCurrent < capacity) {
            const stackRightOrthoCurrent = flatRightOrthoCurrent;
            if (
                    normalP && faces[0][flatRightOrthoCurrent] < 0
                    ||
                    normalM && faces[0][flatRightOrthoCurrent] > 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId+1) ?
                        blocks[flatFaceId+1] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' k linked to current i ' + stackRightOrthoCurrent);
                if (cc[stackRightOrthoCurrent] !== ec[stackRightOrthoCurrent] && cc[stackRightOrthoCurrent]!== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('k, current i: ' + cc[stackRightOrthoCurrent] + ', ' +cc[stackFaceId]);
                    merger.push([cc[stackRightOrthoCurrent], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRightOrthoCurrent, stackFaceId);
            }
        }

        // Previous -> regular orientation
        const flatBackOrthoPrevious = flatBackOrthoCurrent - iS; // j
        if (flatBackOrthoPrevious < capacity && (flatBackOrthoPrevious % ijS === (flatBackOrthoCurrent % ijS) - iS)) {
            const stackBackOrthoPrevious = capacity + flatBackOrthoPrevious;
            if (
                    normalP && faces[1][flatBackOrthoPrevious] > 0
                    ||
                    normalM && faces[1][flatBackOrthoPrevious] < 0 &&
                    (
                        FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId-iS) ?
                        blocks[flatFaceId-iS] === 0 :
                        false // TODO zeefy, refine on double edges
                    )
                )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' k linked to previous j ' + stackBackOrthoPrevious);
                if (cc[stackBackOrthoPrevious] !== ec[stackBackOrthoPrevious] && cc[stackBackOrthoPrevious] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('k, previous j: ' + cc[stackBackOrthoPrevious] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackBackOrthoPrevious], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackBackOrthoPrevious, stackFaceId);
            }
        }

        const flatRightOrthoPrevious = flatRightOrthoCurrent - 1; // i
        const stackRightOrthoPrevious = flatRightOrthoPrevious;
        if (flatRightOrthoPrevious < capacity && (flatRightOrthoPrevious % iS === (flatRightOrthoCurrent % iS) - 1)) {
            if (
                normalP && faces[0][flatRightOrthoPrevious] > 0
                ||
                normalM && faces[0][flatRightOrthoPrevious] < 0 &&
                (
                    FaceLinker.notBoundary(iS, ijS, capacity, flatFaceId-1) ?
                    blocks[flatFaceId-1] === 0 :
                    false // TODO zeefy, refine on double edges
                )
            )
            {
                if (CSFX.debugLinks) console.log(stackFaceId + ' k linked to previous i ' + stackRightOrthoPrevious);
                if (cc[stackRightOrthoPrevious] !== ec[stackRightOrthoPrevious] && cc[stackRightOrthoPrevious] !== cc[stackFaceId])
                {
                    if (CSFX.debugPostMerger) console.log('k, previous i: ' + cc[stackRightOrthoPrevious] + ', ' + cc[stackFaceId]);
                    merger.push([cc[stackRightOrthoPrevious], cc[stackFaceId]]);
                }
                FaceLinker.affect(cc, stackRightOrthoPrevious, stackFaceId);
            }
        }
    }
    
}

export default FaceLinker;
