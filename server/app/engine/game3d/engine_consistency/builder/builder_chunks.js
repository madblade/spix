/**
 *
 */

'use strict';

import ChunkGenerator from './../generator/chunkgenerator';
import BlockExtractor       from './surface_blocks_builder';
import FaceExtractor        from './surface_faces_builder';

class ChunkBuilder {

    static debug = false;

    static serverLoadingRadius = 10;
    static clientLoadingRadius = 2; // Deprecated. See in avatar.js
    static clientUnloadingRadius = 15;

    static computeChunkFaces(chunk) {
        let wm = chunk.worldModel;

        // Preload neighbours.
        if (ChunkBuilder.debug) console.log('\tPreloading neighbor chunks...');
        ChunkBuilder.preloadAllNeighbourChunks(chunk, wm);

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
        let wm = chunk.worldModel;

        switch (direction) {
            case 0: return wm.getChunk(i+1, j, k);      // x+
            case 1:  return wm.getChunk(i-1, j, k);     // x-
            case 2:  return wm.getChunk(i, j+1, k);     // y+
            case 3:  return wm.getChunk(i, j-1, k);     // y-
            case 4:  return wm.getChunk(i, j, k+1);     // z+
            case 5:  return wm.getChunk(i, j, k-1);     // z- (idem)
            case 6:  return wm.getChunk(i+1, j+1, k);
            case 7:  return wm.getChunk(i-1, j+1, k);
            case 8:  return wm.getChunk(i+1, j-1, k);
            case 9:  return wm.getChunk(i-1, j-1, k);
            case 10: return wm.getChunk(i+1, j, k-1);
            case 11: return wm.getChunk(i+1, j, k+1);
            case 12: return wm.getChunk(i-1, j, k-1);
            case 13: return wm.getChunk(i-1, j, k+1);
            case 14: return wm.getChunk(i, j+1, k+1);
            case 15: return wm.getChunk(i, j-1, k+1);
            case 16: return wm.getChunk(i, j+1, k-1);
            case 17: return wm.getChunk(i, j-1, k-1);

            default:
        }
    }

    static isNeighboringChunkLoaded(chunk, direction) {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let wm = chunk.worldModel;

        switch (direction) {
            case 0:  return wm.hasChunk(i+1, j, k); // x+
            case 1:  return wm.hasChunk(i-1, j, k); // x-
            case 2:  return wm.hasChunk(i, j+1, k); // y+
            case 3:  return wm.hasChunk(i, j-1, k); // y-
            case 4:  return wm.hasChunk(i, j, k+1); // z+ (non-flat models)
            case 5:  return wm.hasChunk(i, j, k-1); // z-
            case 6:  return wm.hasChunk(i+1, j+1, k);
            case 7:  return wm.hasChunk(i-1, j+1, k);
            case 8:  return wm.hasChunk(i+1, j-1, k);
            case 9:  return wm.hasChunk(i-1, j-1, k);
            case 10: return wm.hasChunk(i+1, j, k-1);
            case 11: return wm.hasChunk(i+1, j, k+1);
            case 12: return wm.hasChunk(i-1, j, k-1);
            case 13: return wm.hasChunk(i-1, j, k+1);
            case 14: return wm.hasChunk(i, j+1, k+1);
            case 15: return wm.hasChunk(i, j-1, k+1);
            case 16: return wm.hasChunk(i, j+1, k-1);
            case 17: return wm.hasChunk(i, j-1, k-1);
            default:
        }
    }

    static preloadAllNeighbourChunks(chunk, worldModel) {
        let loadedChunks = worldModel.allChunks;
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
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, worldModel);
            worldModel.addChunk(currentId, neighbour);
        }
    }

    static preloadFlatNeighbourChunks(chunk, worldModel) {
        let loadedChunks = worldModel.allChunks;
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
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, worldModel);
            worldModel.addChunk(currentId, neighbour);
        }
    }

    static addChunk(dimX, dimY, dimZ, chunkId, worldModel) {
        // Do compute faces
        let chunk = ChunkGenerator.createChunk(dimX, dimY, dimZ, chunkId, worldModel);
        worldModel.addChunk(chunkId, chunk);
        ChunkBuilder.computeChunkFaces(chunk);
        return chunk;
    }

    // TODO [CRIT] review Z+/- loading.
    static preLoadNextChunk(player, starterChunk, worldModel, forPlayer, consistencyModel, serverLoadingRadius) {
        let avatar = player.avatar;
        const aid = avatar.id;
        let threshold = forPlayer ? avatar.chunkRenderDistance : serverLoadingRadius;
        threshold = Math.min(threshold, serverLoadingRadius);

        let allChunks = worldModel.allChunks;

        const dx = worldModel.xSize,    dy = worldModel.ySize,    dz = worldModel.zSize;
        const si = starterChunk.chunkI, sj = starterChunk.chunkJ, sk = starterChunk.chunkK;
        let i = si,                      j = sj,                   k = sk;

        let hasLoadedChunk = (ic, jc, kc) => consistencyModel.hasChunk(aid, (ic+','+jc+','+kc));

        let chunkIsToBeLoaded = (ic, jc, kc) => {
            let currentId = (ic+','+jc+','+kc);
            let currentChunk = allChunks.get(currentId);

            if (!forPlayer) {
                if (!currentChunk) {
                    return ChunkBuilder.addChunk(dx, dy, dz, currentId, worldModel);
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

        // console.log('not found ' + depth);
    }

    // TODO [CRIT] check implementation.
    static getOOBPlayerChunks(player, starterChunk, consistencyModel, bound) {
        var unloadedChunksForPlayer = {};
        let chunksToUnload = [];

        let aid = player.avatar.id;
        let chunkIdsForEntity = consistencyModel.chunkIdsForEntity(aid);
        let distance = consistencyModel.infiniteNormDistance;

        let starterChunkPosition = starterChunk.chunkId.split(',');
        chunkIdsForEntity.forEach(chunkId => {
            const currentChunkPosition = chunkId.split(',');
            const d = distance(starterChunkPosition, currentChunkPosition);
            if (d > bound) chunksToUnload.push(chunkId);
        });

        // Recurse on unloaded chunk ids.
        for (let i = 0, l = chunksToUnload; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            unloadedChunksForPlayer[chunkToUnload] = null;
        }

        return unloadedChunksForPlayer;
    }

}

export default ChunkBuilder;
