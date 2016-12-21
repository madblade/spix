/**
 *
 */

'use strict';

class ChunkIterator {

    /**
     *
     * @param worldModel
     * @param starterChunk
     * @param callback
     *      Callback must return FALSE for early termination
     * @param callbackAdditionalParameters
     * @constructor
     */
    static BFS(worldModel, starterChunk, callback, callbackAdditionalParameters) {

        let queue = [];
        let markers = [];

        queue.push(starterChunk);
        while (!queue.empty()) {

            let current = queue.pop();
            markers.push(current);

            // Make your dreams come true
            let status = callback(current, worldModel, callbackAdditionalParameters);

            // Hard-cut when a chunk is to be loaded (client)
            // WARN! Don't cut server side!!!
            if (!status)
            {
                return;
            }

            let neighbours = ChunkIterator.get2DNeighbours(current, worldModel);
            for (let i = 0, l = neighbours.length; i < l; ++i) {

                let neighbour = neighbours[i];
                if (markers.indexOf(neighbour) < 0) {

                    markers.push(neighbour);
                    queue.push(neighbour);
                }
            }
        }
    }

    static get2DNeighbours(currentChunk, worldModel) {
        const i = currentChunk.chunkI;
        const j = currentChunk.chunkJ;
        const k = currentChunk.chunkK;
        let chunks = worldModel.allChunks;

        let neighboursIndices = [
            (i+1)   +','+j      +','+k,
            (i+1)   +','+(j+1)  +','+k,
            i       +','+(j+1)  +','+k,
            (i-1)   +','+(j+1)  +','+k,
            (i-1)   +','+j      +','+k,
            (i-1)   +','+(j-1)  +','+k,
            i       +','+(j-1)  +','+k
        ];

        let neighbours = [];

        for (let id = 0, length = neighboursIndices.length; id < length; ++id) {
            let chunkId = neighboursIndices[id];
            let chunk = chunks.get(chunkId);
            if (!chunk) console.log('Iterator: chunk ' + chunkId + ' undefined.');
            else neighbours.push(chunk);
        }

        /*

            i 	j	k <- starter
            i+1	j	k
            i+1	j+1	k
            i	j+1	k
            i-1	j+1	k
            i-1	j	k
            i-1	j-1	k
            i	j-1	k

        */

        return neighbours;
    }

    static get3DNeighbours(currentChunk) {
        let neighbours = [];

        /*
            i	j	k <- starter
            i 	j	k+1
            i+1	j	k+1
            i+1	j+1	k+1
            i	j+1	k+1
            i-1	j+1	k+1
            i-1	j	k+1
            i-1	j-1	k+1
            i	j-1	k+1
            // Next layer, reverse order
            i	j-1	k
            i-1	j-1	k
            i-1	j	k
            i-1	j+1	k
            i	j+1	k
            i+1	j+1	k
            i+1	j	k
            // Last layer, reverse order again >_<
            i+1	j	k-1
            i+1	j+1	k-1
            i	j+1	k-1
            i-1	j+1	k-1
            i-1	j	k-1
            i-1	j-1	k-1
            i	j-1	k-1
            i 	j	k-1
        */

    }

    static getClosestChunk(xPosition, yPosition, zPosition, worldModel) {
        let allChunks = worldModel.allChunks;

        const dx = worldModel.chunkDimensionX;
        const dy = worldModel.chunkDimensionY;
        const dz = worldModel.chunkDimensionZ;

        // TODO [HIGH] DRY with manager.getChunkCoordinatesFromFloatingPoint
        const fx = Math.floor(xPosition);
        const fy = Math.floor(yPosition);
        const fz = Math.floor(zPosition);

        let chunkI = (fx - ( (fx >= 0 ? fx : (dx + fx)) %dx)) / dx;
        let chunkJ = (fy - ( (fy >= 0 ? fy : (dy + fy)) %dy)) / dy;
        let chunkK = (fz - ( (fz >= 0 ? fz : (dz + fz)) %dz)) / dz;

        const id = chunkI+','+chunkJ+','+chunkK;

        let closestChunk = allChunks.get(id);
        if (!closestChunk) {
            console.log('WAIT... Chunk I\'m on is not loaded?');
        }

        return closestChunk;
    }

}

export default ChunkIterator;
