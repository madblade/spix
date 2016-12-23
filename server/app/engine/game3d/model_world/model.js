/**
 *
 */

'use strict';

import NumberUtils from '../../math/numbers';

class WorldModel {

    constructor(game) {
        this._game = game;

        // Objects.

        // Chunk id (i+','+j+','+k) -> chunk
        this._chunks = new Map();

        // Keep same generation method
        this._generationMethod = "flat";

        // Constants
        this._xSize = 8;
        this._ySize = 8;
        this._zSize = 256;

        // Handle
        this._handle = game.gameId;
    }

    get handle() { return this._handle; }
    get allChunks() { return this._chunks; }

    get chunkDimensionX() { return this._xSize; }
    get chunkDimensionY() { return this._ySize; }
    get chunkDimensionZ() { return this._zSize; }

    get generationMethod() { return this._generationMethod; }
    get entityModel() { return this._game.entityModel; }

    set allChunks(newChunks) { this._chunks = newChunks; }
    set generationMethod(newGenerationMethod) { this._generationMethod = newGenerationMethod; }

    addChunk(id, chunk) {
        this._chunks.set(id, chunk);
    }

    getChunkCoordinates(x, y, z) {
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        let f = Math.floor;
        let i = f(x/dx);
        let j = f(y/dy);
        let k = f(z/dz);

        return [i,j,k];
    }

    whatBlock(x, y, z) {
        const dx = this.chunkDimensionX;
        const dy = this.chunkDimensionY;
        const dz = this.chunkDimensionZ;

        let coordinates = this.getChunkCoordinates(x, y, z);
        const i = coordinates[0];
        const j = coordinates[1];
        const k = coordinates[2];

        const chunkX = x - i * dx;
        const chunkY = y - j * dy;
        const chunkZ = z - k * dz;

        const chunkId = i+','+j+','+k;
        let chunk = this._chunks.get(chunkId);
        if (!chunk || chunk === undefined) {console.log('ChkMgr@whatBlock: could not find chunk ' + chunkId +
            ' from ' + x+','+y+','+z);
            // TODO [MEDIUM] load concerned chunk.
            // TODO [MEDIUM] check minus
            return;
        }
        return chunk.what(chunkX, chunkY, chunkZ);
    }

    getFreePosition() {
        let z = 150;
        while (this.whatBlock(4, 4, z) !== 0 && z < this._zSize) ++z;
        return [4.5, 4.5, z];
    }

    getChunk(iCoordinate, jCoordinate, kCoordinate) {
        let id = iCoordinate+','+jCoordinate+','+kCoordinate;
        return this._chunks.get(id);
    }

    hasChunk(i, j, k) {
        return !!(this.getChunk(i, j, k));
    }

    isFree(p) {
        return this.whatBlock(p[0], p[1], p[2]) === 0; // && this.whatBlock(p[0], p[1], p[2]+1) === 0;
    }

}

export default WorldModel;
