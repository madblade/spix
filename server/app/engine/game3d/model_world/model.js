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

    get xSize() { return this._xSize; }
    get ySize() { return this._ySize; }
    get zSize() { return this._zSize; }

    get generationMethod() { return this._generationMethod; }
    get entityModel() { return this._game.entityModel; }

    set allChunks(newChunks) { this._chunks = newChunks; }
    set generationMethod(newGenerationMethod) { this._generationMethod = newGenerationMethod; }

    addChunk(id, chunk) {
        this._chunks.set(id, chunk);
    }

    getChunkCoordinates(x, y, z) {
        let f = Math.floor;
        const dx = this.xSize, dy = this.ySize, dz = this.zSize;
        return [f(x/dx), f(y/dy), f(z/dz)];
    }

    whatBlock(x, y, z) {
        let coords = this.getChunkCoordinates(x, y, z);

        const dx = this.xSize, dy = this.ySize, dz = this.zSize;
        const i = coords[0], j = coords[1], k = coords[2];

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
