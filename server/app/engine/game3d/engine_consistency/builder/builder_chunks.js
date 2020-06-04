/**
 *
 */

'use strict';

import ChunkGenerator       from './../generator/chunkgenerator';
import BlockExtractor       from './surface_blocks_builder';
import FaceExtractor        from './surface_faces_builder';

class ChunkBuilder
{
    static debug = false;

    static computeChunkFaces(chunk)
    {
        let world = chunk.world;

        // Preload neighbours.
        if (ChunkBuilder.debug) console.log('\tPreloading neighbor chunks...');
        ChunkBuilder.preloadAllNeighbourChunks(chunk, world);

        // Detect boundary blocks.
        if (ChunkBuilder.debug) console.log('\tExtracting surface...');
        BlockExtractor.extractSurfaceBlocks(chunk);

        // Detect connected boundary face components.
        if (ChunkBuilder.debug) console.log('\tComputing connected components...');
        FaceExtractor.extractConnectedComponents(chunk); //

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
    static getNeighboringChunk(chunk, direction)
    {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let world = chunk.world;

        switch (direction) {
            case 0:  return world.getChunk(i + 1, j, k);     // x+
            case 1:  return world.getChunk(i - 1, j, k);     // x-
            case 2:  return world.getChunk(i, j + 1, k);     // y+
            case 3:  return world.getChunk(i, j - 1, k);     // y-
            case 4:  return world.getChunk(i, j, k + 1);     // z+
            case 5:  return world.getChunk(i, j, k - 1);     // z- (idem)
            case 6:  return world.getChunk(i + 1, j + 1, k);
            case 7:  return world.getChunk(i - 1, j + 1, k);
            case 8:  return world.getChunk(i + 1, j - 1, k);
            case 9:  return world.getChunk(i - 1, j - 1, k);
            case 10: return world.getChunk(i + 1, j, k - 1);
            case 11: return world.getChunk(i + 1, j, k + 1);
            case 12: return world.getChunk(i - 1, j, k - 1);
            case 13: return world.getChunk(i - 1, j, k + 1);
            case 14: return world.getChunk(i, j + 1, k + 1);
            case 15: return world.getChunk(i, j - 1, k + 1);
            case 16: return world.getChunk(i, j + 1, k - 1);
            case 17: return world.getChunk(i, j - 1, k - 1);

            default:
        }
    }

    static isNeighboringChunkLoaded(chunk, direction)
    {
        let i = chunk.chunkI;
        let j = chunk.chunkJ;
        let k = chunk.chunkK;
        let world = chunk.world;

        switch (direction) {
            case 0:  return world.hasChunk(i + 1, j, k); // x+
            case 1:  return world.hasChunk(i - 1, j, k); // x-
            case 2:  return world.hasChunk(i, j + 1, k); // y+
            case 3:  return world.hasChunk(i, j - 1, k); // y-
            case 4:  return world.hasChunk(i, j, k + 1); // z+ (non-flat models)
            case 5:  return world.hasChunk(i, j, k - 1); // z-
            case 6:  return world.hasChunk(i + 1, j + 1, k);
            case 7:  return world.hasChunk(i - 1, j + 1, k);
            case 8:  return world.hasChunk(i + 1, j - 1, k);
            case 9:  return world.hasChunk(i - 1, j - 1, k);
            case 10: return world.hasChunk(i + 1, j, k - 1);
            case 11: return world.hasChunk(i + 1, j, k + 1);
            case 12: return world.hasChunk(i - 1, j, k - 1);
            case 13: return world.hasChunk(i - 1, j, k + 1);
            case 14: return world.hasChunk(i, j + 1, k + 1);
            case 15: return world.hasChunk(i, j - 1, k + 1);
            case 16: return world.hasChunk(i, j + 1, k - 1);
            case 17: return world.hasChunk(i, j - 1, k - 1);
            default:
        }
    }

    static preloadAllNeighbourChunks(chunk, world)
    {
        let loadedChunks = world.allChunks;
        let c = chunk;
        let dims = c.dimensions;
        let ci = c.chunkI;
        let cj = c.chunkJ;
        let ck = c.chunkK;

        let neighbourIds = [
            `${ci + 1},${cj},${ck}`,        //  i+1,	j,		k
            `${ci},${cj + 1},${ck}`,        //  i-1,	j,		k
            `${ci},${cj},${ck + 1}`,        //  i,		j+1,	k
            `${ci - 1},${cj},${ck}`,        //  i,		j-1,	k
            `${ci},${cj - 1},${ck}`,        //  i,		j,		k+1
            `${ci},${cj},${ck - 1}`,        //  i,		j,		k-1

            `${ci + 1},${cj + 1},${ck}`,    //  i+1,	j+1,	k
            `${ci - 1},${cj + 1},${ck}`,    //  i-1,	j+1,	k
            `${ci + 1},${cj - 1},${ck}`,    //  i+1,	j-1,	k
            `${ci - 1},${cj - 1},${ck}`,    //  i-1,	j-1,	k
            `${ci + 1},${cj},${ck - 1}`,    //  i+1,	j,		k-1
            `${ci + 1},${cj},${ck + 1}`,    //  i+1,	j,		k+1
            `${ci - 1},${cj},${ck - 1}`,    //  i-1,	j,		k-1
            `${ci - 1},${cj},${ck + 1}`,    //  i-1,	j,		k+1

            `${ci},${cj + 1},${ck + 1}`,    //  i,		j+1,	k+1
            `${ci},${cj - 1},${ck + 1}`,    //  i,		j-1,	k+1
            `${ci},${cj + 1},${ck - 1}`,    //  i,		j+1,	k-1
            `${ci},${cj - 1},${ck - 1}`     //  i,		j-1,	k-1
        ];

        for (let i = 0, length = neighbourIds.length; i < length; ++i)
        {
            let currentId = neighbourIds[i];
            if (loadedChunks.has(currentId)) continue;

            // Don't compute faces
            let neighbour = ChunkGenerator.createChunk(dims[0], dims[1], dims[2], currentId, world);
            world.addChunk(currentId, neighbour);
        }
    }

    /**
     * @deprecated
     */
    static preloadFlatNeighbourChunks(chunk, world)
    {
        let loadedChunks = world.allChunks;
        let c = chunk;
        let ci = c.chunkI;
        let cj = c.chunkJ;
        let ck = c.chunkK;
        let dims = c.dimensions;

        let neighbourIds = [
            `${ci + 1},${cj},${ck}`,
            `${ci},${cj + 1},${ck}`,
            `${ci},${cj},${ck + 1}`,
            `${ci - 1},${cj},${ck}`,
            `${ci},${cj - 1},${ck}`,
            `${ci},${cj},${ck - 1}`
        ];

        for (let i = 0, length = neighbourIds.length; i < length; ++i)
        {
            let currentId = neighbourIds[i];
            if (loadedChunks.has(currentId)) continue;

            // Don't compute faces
            let neighbour = ChunkGenerator.createChunk(
                dims[0], dims[1], dims[2], currentId, world
            );
            world.addChunk(currentId, neighbour);
        }
    }

    static addChunk(dimX, dimY, dimZ, chunkId, world)
    {
        // Do compute faces
        let chunk = ChunkGenerator.createChunk(dimX, dimY, dimZ, chunkId, world);
        world.addChunk(chunkId, chunk);
        ChunkBuilder.computeChunkFaces(chunk);
        return chunk;
    }

    static loadNextChunk(
        player, startWid, startCid, worldModel, xModel,
        consistencyModel, serverLoadingRadius, forPlayer)
    {
        let avatar = player.avatar;
        let threshold = forPlayer ? avatar.chunkRenderDistance : serverLoadingRadius;
        threshold = Math.min(threshold, serverLoadingRadius);

        let connectivity = xModel.getConnectivity(startWid, startCid, worldModel, threshold, true, !forPlayer);
        if (!connectivity) return;
        let chunks = connectivity[1]; // !! Should be sorted from the nearest to the farthest.
        if (!chunks) return;
        let aid = avatar.entityId;

        for (let id = 0, l = chunks.length; id < l; ++id)
        {
            let current = chunks[id];

            let wid = current[0];
            let currentId = current[1];

            const hasLoadedChunk = consistencyModel.hasChunk(aid, wid, currentId);
            if (hasLoadedChunk)
            {
                let currentWorld = worldModel.getWorld(wid);
                let currentChunks = currentWorld.allChunks;
                let currentChunk = currentChunks.get(currentId);
                const dx = currentWorld.xSize;
                const dy = currentWorld.ySize;
                const dz = currentWorld.zSize;

                if (!forPlayer) {
                    if (!currentChunk) {
                        currentChunk = ChunkBuilder.addChunk(dx, dy, dz, currentId, currentWorld);
                        currentChunks.set(currentId, currentChunk);
                        ChunkBuilder.computeChunkFaces(currentChunk);
                        return currentChunk;
                    } else if (!currentChunk.ready) {
                        ChunkBuilder.computeChunkFaces(currentChunk);
                        return currentChunk;
                    } else return null;
                } else {
                    return currentChunk;
                }
            }
        }
    }

    static getOOBPlayerChunks(player, starterChunk, worldModel, xModel, consistencyModel, thresh)
    {
        let avatar = player.avatar;
        let unloadedChunksForPlayer = {};
        let chunksToUnload = [];

        let aid = avatar.entityId;
        let startWid = avatar.worldId;
        let chunkIdsForEntity = consistencyModel.chunkIdsPerWorldForEntity(aid);

        let w = worldModel.getWorld(startWid);
        if (!w) { console.log('Could not get starting world from avatar.'); return; }
        let c = w.getChunkByCoordinates(...avatar.position);
        if (!c) { console.log('Could not get starting chunk from avatar.'); return; }
        let startCid = c.chunkId;
        let connectivity = xModel.getConnectivity(startWid, startCid, worldModel, thresh, true);
        let okChunks = connectivity[1];
        let marks = new Map();
        okChunks.forEach(okCurrent => marks.set(`${okCurrent[0]},${okCurrent[1]}`, okCurrent[2]));

        chunkIdsForEntity.forEach((chunkIds, worldId) => {
            chunkIds.forEach(chunkId => {
                let distance = marks.get(`${worldId},${chunkId}`);
                if (distance === undefined || distance === null || distance > thresh)
                    chunksToUnload.push([worldId, chunkId]);
            });
        });

        // Recurse on unloaded chunk ids.
        for (let i = 0, l = chunksToUnload.length; i < l; ++i) {
            let chunkToUnload = chunksToUnload[i];
            let currentWorld = chunkToUnload[0];
            let currentId = chunkToUnload[1];
            if (!unloadedChunksForPlayer.hasOwnProperty(currentWorld))
                unloadedChunksForPlayer[currentWorld] = {};

            unloadedChunksForPlayer[currentWorld][currentId] = null;
        }

        return unloadedChunksForPlayer;
    }
}

export default ChunkBuilder;
