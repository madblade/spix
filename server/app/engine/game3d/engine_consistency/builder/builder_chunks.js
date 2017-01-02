/**
 *
 */

'use strict';

import GeometryUtils        from '../../../math/geometry';

import ChunkGenerator       from './../generator/chunkgenerator';
import BlockExtractor       from './surface_blocks_builder';
import FaceExtractor        from './surface_faces_builder';

class ChunkBuilder {

    static debug = false;

    static serverLoadingRadius = 10;
    static clientLoadingRadius = 2; // Deprecated. See in avatar.js
    static clientUnloadingRadius = 15;

    static computeChunkFaces(chunk) {
        let world = chunk.world;

        // Preload neighbours.
        if (ChunkBuilder.debug) console.log('\tPreloading neighbor chunks...');
        ChunkBuilder.preloadAllNeighbourChunks(chunk, world);

        // Detect boundary blocks.
        if (ChunkBuilder.debug) console.log('\tExtracting surface...');
        BlockExtractor.extractSurfaceBlocks(chunk);

        // Detect connected boundary face components.
        if (ChunkBuilder.debug) console.log("\tComputing connected components...");
        FaceExtractor.extractConnectedComponents(chunk);

        chunk.ready = true;
    }

    /** MODEL
     0	i+1,	j,		k
     1	i-1,	j,		k
     2	i,		j+1,	k
     3	i,		j-1,	k
     4	i,		j,		k+1
     5	i,		j,		k-1
     6	i+1,	j+1,	k
     7	i-1,	j+1,	k
     8	i+1,	j-1,	k
     9	i-1,	j-1,	k
     10	i+1,	j,		k-1
     11	i+1,	j,		k+1
     12	i-1,	j,		k-1
     13	i-1,	j,		k+1
     14	i,		j+1,	k+1
     15	i,		j-1,	k+1
     16	i,		j+1,	k-1
     17	i,		j-1,	k-1
    */
    static getNeighboringChunk(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let world = chunk.world;

        switch (direction) {
            case 0: return world.getChunk(i+1, j, k);      // x+
            case 1:  return world.getChunk(i-1, j, k);     // x-
            case 2:  return world.getChunk(i, j+1, k);     // y+
            case 3:  return world.getChunk(i, j-1, k);     // y-
            case 4:  return world.getChunk(i, j, k+1);     // z+
            case 5:  return world.getChunk(i, j, k-1);     // z- (idem)
            case 6:  return world.getChunk(i+1, j+1, k);
            case 7:  return world.getChunk(i-1, j+1, k);
            case 8:  return world.getChunk(i+1, j-1, k);
            case 9:  return world.getChunk(i-1, j-1, k);
            case 10: return world.getChunk(i+1, j, k-1);
            case 11: return world.getChunk(i+1, j, k+1);
            case 12: return world.getChunk(i-1, j, k-1);
            case 13: return world.getChunk(i-1, j, k+1);
            case 14: return world.getChunk(i, j+1, k+1);
            case 15: return world.getChunk(i, j-1, k+1);
            case 16: return world.getChunk(i, j+1, k-1);
            case 17: return world.getChunk(i, j-1, k-1);

            default:
        }
    }

    static isNeighboringChunkLoaded(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let world = chunk.world;

        switch (direction) {
            case 0:  return world.hasChunk(i+1, j, k); // x+
            case 1:  return world.hasChunk(i-1, j, k); // x-
            case 2:  return world.hasChunk(i, j+1, k); // y+
            case 3:  return world.hasChunk(i, j-1, k); // y-
            case 4:  return world.hasChunk(i, j, k+1); // z+ (non-flat models)
            case 5:  return world.hasChunk(i, j, k-1); // z-
            case 6:  return world.hasChunk(i+1, j+1, k);
            case 7:  return world.hasChunk(i-1, j+1, k);
            case 8:  return world.hasChunk(i+1, j-1, k);
            case 9:  return world.hasChunk(i-1, j-1, k);
            case 10: return world.hasChunk(i+1, j, k-1);
            case 11: return world.hasChunk(i+1, j, k+1);
            case 12: return world.hasChunk(i-1, j, k-1);
            case 13: return world.hasChunk(i-1, j, k+1);
            case 14: return world.hasChunk(i, j+1, k+1);
            case 15: return world.hasChunk(i, j-1, k+1);
            case 16: return world.hasChunk(i, j+1, k-1);
            case 17: return world.hasChunk(i, j-1, k-1);
            default:
        }
    }

    static preloadAllNeighbourChunks(chunk, world) {
        let loadedChunks = world.allChunks;
        let c = chunk;
        let dims = c.dimensions;
        let ci = c.chunkI, cj = c.chunkJ, ck = c.chunkK;

        let neighbourIds = [
            (ci+1)+','+cj+','+ck,           //  i+1,	j,		k
            ci+','+(cj+1)+','+ck,           //  i-1,	j,		k
            ci+','+cj+','+(ck+1),           //  i,		j+1,	k
            (ci-1)+','+cj+','+ck,           //  i,		j-1,	k
            ci+','+(cj-1)+','+ck,           //  i,		j,		k+1
            ci+','+cj+','+(ck-1),           //  i,		j,		k-1
            (ci+1)+','+(cj+1)+','+(ck),     //  i+1,	j+1,	k
            (ci-1)+','+(cj+1)+','+(ck),     //  i-1,	j+1,	k
            (ci+1)+','+(cj-1)+','+(ck),     //  i+1,	j-1,	k
            (ci-1)+','+(cj-1)+','+(ck),     //  i-1,	j-1,	k
            (ci+1)+','+(cj)+','+(ck-1),     //  i+1,	j,		k-1
            (ci+1)+','+(cj)+','+(ck+1),     //  i+1,	j,		k+1
            (ci-1)+','+(cj)+','+(ck-1),     //  i-1,	j,		k-1
            (ci-1)+','+(cj)+','+(ck+1),     //  i-1,	j,		k+1
            (ci)+','+(cj+1)+','+(ck+1),     //  i,		j+1,	k+1
            (ci)+','+(cj-1)+','+(ck+1),     //  i,		j-1,	k+1
            (ci)+','+(cj+1)+','+(ck-1),     //  i,		j+1,	k-1
            (ci)+','+(cj-1)+','+(ck-1)      //  i,		j-1,	k-1
        ];

        for (let i = 0, length = neighbourIds.length; i < length; ++i) {
            let currentId = neighbourIds[i];
            if (loadedChunks.has(currentId)) continue;

            // Don't compute faces
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, world);
            world.addChunk(currentId, neighbour);
        }
    }

    static preloadFlatNeighbourChunks(chunk, world) {
        let loadedChunks = world.allChunks;
        let c = chunk;
        let ci = c.chunkI;
        let cj = c.chunkJ;
        let ck = c.chunkK;
        let dims = c.dimensions;

        let neighbourIds = [
            (ci+1)+','+cj+','+ck,
            ci+','+(cj+1)+','+ck,
            ci+','+cj+','+(ck+1),
            (ci-1)+','+cj+','+ck,
            ci+','+(cj-1)+','+ck,
            ci+','+cj+','+(ck-1)
        ];

        for (let i = 0, length = neighbourIds.length; i < length; ++i) {
            let currentId = neighbourIds[i];
            if (loadedChunks.has(currentId)) continue;

            // Don't compute faces
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, world);
            world.addChunk(currentId, neighbour);
        }
    }

    static addChunk(dimX, dimY, dimZ, chunkId, world) {
        // Do compute faces
        let chunk = ChunkGenerator.createChunk(dimX, dimY, dimZ, chunkId, world);
        world.addChunk(chunkId, chunk);
        ChunkBuilder.computeChunkFaces(chunk);
        return chunk;
    }

    static preLoadNextChunk(player, starterChunk, world, forPlayer, consistencyModel, serverLoadingRadius) {
        let avatar = player.avatar;
        // TODO [CRIT] worldify check chain of events: avatar could have crossed a portal meanwhile.
        let worldId = avatar.worldId;
        const aid = avatar.id;
        let threshold = forPlayer ? avatar.chunkRenderDistance : serverLoadingRadius;
        threshold = Math.min(threshold, serverLoadingRadius);

        // TODO [CRIT] worldify get a tree with other 'allChunks' from xModel.getConnectivity
        let allChunks = world.allChunks;

        const dx = world.xSize,    dy = world.ySize,    dz = world.zSize;
        const si = starterChunk.chunkI, sj = starterChunk.chunkJ, sk = starterChunk.chunkK;
        let i = si,                      j = sj,                   k = sk;

        let hasLoadedChunk = (ic, jc, kc) => consistencyModel.hasChunk(aid, worldId, (ic+','+jc+','+kc));

        let chunkIsToBeLoaded = (ic, jc, kc) => {
            let currentId = (ic+','+jc+','+kc);
            let currentChunk = allChunks.get(currentId);

            if (!forPlayer) {
                if (!currentChunk) {
                    currentChunk = ChunkBuilder.addChunk(dx, dy, dz, currentId, world);
                    allChunks.set(currentId, currentChunk);
                    return currentChunk;
                } else if (!currentChunk.ready) {
                    ChunkBuilder.computeChunkFaces(currentChunk);
                    return currentChunk;
                } else return null;
            } else {
                if (!hasLoadedChunk(ic, jc, kc)) {
                    return currentChunk;
                } else return null;
            }
        };

        let depth = 0;
        let d3 = true;

        let tI, tJ, tK;
        // Test all chunks in > distance order.
        while (depth <= threshold) {
            ++depth;

            // Differential 3D loading here.
            // TODO [LOW] simplify redundancy checks.
            for (let deltaK = 0, kLimit = d3?depth:0; deltaK < kLimit; ++deltaK) {
                for (let deltaI = 0, iLimit = depth; deltaI < iLimit; ++deltaI) {
                    for (let deltaJ = 0, jLimit = depth; deltaJ < jLimit; ++deltaJ) {
                        if (deltaI === 0 && deltaJ === 0 && deltaK === 0) continue;

                        tI = (i + deltaI); tJ = (j + deltaJ); tK = (k + deltaK);    //  1   1   1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);
                        tI = (i - deltaI);                                          //  -1  1   1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);

                        tI = (i + deltaI); tJ = (j - deltaJ);                       //  1  -1   1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);
                        tI = (i - deltaI);                                          //  -1  -1  1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);

                        tI = (i + deltaI); tJ = (j + deltaJ); tK = (k - deltaK);    //  1   1   -1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);
                        tI = (i - deltaI);                                          //  -1  1   -1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);

                        tI = (i + deltaI); tJ = (j - deltaJ);                       //  1   -1  -1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);
                        tI = (i - deltaI);                                          //  -1  -1  -1
                        if (!hasLoadedChunk(tI, tJ, tK)) return chunkIsToBeLoaded(tI, tJ, tK);
                    }
                }
            }

        }
    }

    static getOOBPlayerChunks(player, starterChunk, consistencyModel, bound) {
        let avatar = player.avatar;
        var unloadedChunksForPlayer = {};
        let chunksToUnload = [];

        let aid = avatar.id;
        let mainWorldId = avatar.worldId;
        let chunkIdsForEntity = consistencyModel.chunkIdsPerWorldForEntity(aid);
        let distance = GeometryUtils.infiniteNormDistance;

        let starterChunkPosition = starterChunk.chunkId.split(',');
        chunkIdsForEntity.forEach((chunkIds, worldId) => {
            chunkIds.forEach(chunkId => {
                const currentChunkPosition = chunkId.split(',');
                // TODO [CRIT] worldify distance criterion, use chunks from other worlds.
                const d = distance(starterChunkPosition, currentChunkPosition);
                if (d > bound) {
                    chunksToUnload.push(chunkId);
                }
            })
        });

        // Recurse on unloaded chunk ids.
        unloadedChunksForPlayer[mainWorldId] = {};
        for (let i = 0, l = chunksToUnload.length; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            unloadedChunksForPlayer[mainWorldId][chunkToUnload] = null;
        }

        return unloadedChunksForPlayer;
    }

}

export default ChunkBuilder;
