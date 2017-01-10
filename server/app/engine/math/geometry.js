/**
 *
 */

'use strict';

class GeometryUtils {

    /** Common topology distances **/

    // TODO [CRIT] worldify (with xModel.getConnectivity)
    static infiniteNormDistance(pos1, pos2) {
        var d = 0;
        for (let i = 0; i < 3; ++i)
            d = Math.max(d, Math.abs(parseInt(pos1[i]) - parseInt(pos2[i])));
        return d;
    };

    static chunkSquaredEuclideanDistance(pos1, pos2) {
        let result = 0, d;
        for (let i = 0; i<3; ++i) { d = pos1[i]-pos2[i]; result += d*d; }
        return result;
    };

    // TODO [CRIT] worldify: test worldId
    static entitySquaredEuclideanDistance(entityX, entityY) {
        let result = 0; let d;
        let pX = entityX.position, pY = entityY.position;
        for (let i = 0; i<3; ++i) { d = pX[i]-pY[i]; result += d*d; }
        return result;
    };

    static euclideabDistance3(v1, v2) {
        let x = v1[0]-v2[0]; x*=x;
        let y = v1[1]-v2[1]; y*=y;
        let z = v1[2]-v2[2]; z*=z;
        return Math.sqrt(x+y+z);
    }

    /** Weird topology distances **/

    // TODO [MEDIUM] there is a way to heavily optimize this request.
    // Every time a portal is created, you add in an associative map
    // coordinates of both linked chunks (order is important).
    // Then you can compute offsets for two chunks in different worlds (just take
    // min distance by considering all possible combinations of ways going through superposed chunks).
    // A way to do it efficiently is to keep a Voronoi-like structure that emulate a geographical sorting of gates,
    // along with a sorted list of distance further between any pair of 4D subworlds.
    // Do a bit of graph analysis here.
    static entityToPortalDistance(entity, portal, xModel, wModel, thresh) {
        // Get starting chunk.
        let chunk = wModel.getWorld(entity.worldId).getChunkByCoordinates(...entity.position);
        let targetId = portal.id;

        // BFS.
        let done = new Set();
        let depth = 0;
        let stack = [[chunk, depth]];
        while (stack.length > 0 && depth < thresh) {
            // Test current element: does it contain target?
            let element = stack.shift();

            let currentChunk = element[0];
            let currentDepth = element[1];

            let worldId = currentChunk.world.worldId;
            let chunkId = currentChunk.chunkId;

            let doneId = worldId.toString()+chunkId.toString();
            if (done.has(doneId)) continue;
            done.add(doneId);

            if (xModel.chunkContainsPortal(worldId, chunkId, targetId))
                return currentDepth;

            depth = currentDepth;
            let world = wModel.getWorld(worldId);
            let ijk = chunkId.split(',');
            let i = ijk[0], j = ijk[1], k = ijk[2];

            // Lazily evaluate connectivity then push front.

            // Regular connectivity.
            let chks = [
                world.getChunk(i+1, j, k),
                world.getChunk(i-1, j, k),
                world.getChunk(i, j+1, k),
                world.getChunk(i, j-1, k),
                world.getChunk(i, j, k+1),
                world.getChunk(i, j, k-1)
            ];
            chks.forEach(c => { if (c) { // Not loaded => doesn't contain a portal.
                stack.push([c, currentDepth+1]);
            }});

            // Weird connectivity.
            let gates = xModel.getPortalsFromChunk(worldId, chunkId);
            if (gates) {
                gates.forEach(g => {
                    let otherSide = xModel.getOtherSide(g);
                    if (!otherSide) return;
                    let otherChunk = otherSide.chunk;

                    if (otherChunk) stack.push([otherChunk, currentDepth+1]);
                });
            }
        }

        // Possibly in other worlds :)
        return Number.POSITIVE_INFINITY;
    }

}

export default GeometryUtils;
