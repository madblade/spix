/**
 *
 */

'use strict';

import World from './world';
import CollectionUtils from '../../math/collections';
import { GameType } from '../game';

const BlockType = Object.freeze({
    AIR: 0,
    GRASS: 1,
    STONE: 2,
    DIRT: 3,
    WOOD: 4,
    PLANKS: 5,
    STONEBRICKS: 6,
    BRICKS: 7,

    WATER: 16,

    SAND: 17,
    IRON: 18
});

const WorldType = Object.freeze({
    FLAT: 0, // Symbol('flat'),
    CUBE: 1, // Symbol('cube'),
    SHRIKE: 2, // Symbol('shrike'),
    UNSTRUCTURED: 3 // Symbol('unstructured')
});

const HillType = Object.freeze({
    NO_HILLS: 0, // Symbol('no-hills'),
    REGULAR_HILLS: 1, // Symbol('regular-hills'),
    GIANT_HILLS: 2, // Symbol('giant-hills'),
    ERODED: 3, // Symbol('eroded-formations'),
    SPIKES: 4 // Symbol('spikes'),
});

const CaveType = Object.freeze({
    NO_CAVES: 0, // Symbol('no-caves'),
    SUBSURFACE_CAVES: 1 // Symbol('subsurface-caves'),
});

const ChunkSizes = Object.freeze({
    CUBE_VERY_SMALL: [2, 2, 2],
    CUBE_SMALL: [4, 4, 4],
    CUBE_REGULAR: [8, 8, 8],
    CUBE_HUGE: [16, 16, 16],
    FLAT_SMALL: [8, 8, 16],
    FLAT_REGULAR: [16, 16, 16], // TODO 32
    FLAT_HUGE: [32, 32, 64]
});

class BlockTypes {
    static isBlock(id) {
        return id !== BlockType.AIR &&
            (id >= BlockType.GRASS && id <= BlockType.BRICKS ||
                id >= BlockType.SAND && id <= BlockType.IRON);
    }
}

class WorldModel
{
    static serverLoadingRadius = 3;

    constructor(game)
    {
        this._game = game;
        this._worlds = new Map();

        let masterWorldInfo = this.generateWorldInfoFromGameInfo(-1);
        this._worlds.set(-1, new World(-1, masterWorldInfo, this));
    }

    get worlds() { return this._worlds; }

    addWorld(worldId)
    {
        let wid  = worldId || CollectionUtils.generateId(this._worlds);
        if (this._worlds.has(wid)) return;

        let newWorldInfo = this.generateWorldInfoFromGameInfo(wid);
        let w = new World(wid, newWorldInfo, this);
        this._worlds.set(wid, w);

        return w;
    }

    getWorld(worldId) {
        if (!worldId) worldId = -1;
        return this._worlds.get(worldId);
    }

    getFreeWorld() {
        return this.getWorld(-1);
    }

    generateWorldInfoFromGameInfo(worldId)
    {
        let worldInfo = {};
        let gameInfo = this._game.gameInfo;
        let gk = gameInfo.kind;
        let wk = WorldType.FLAT;
        switch (gk) {
            case GameType.DEMO:
                let wid = parseInt(worldId, 10);
                if (wid === 2) {
                    return {
                        kind: WorldType.CUBE,
                        sideSize: 4,
                        hills: HillType.NO_HILLS,
                        caves: CaveType.NO_CAVES
                    };
                } else if (wid === 3) {
                    return {
                        kind: WorldType.CUBE,
                        sideSize: 16,
                        hills: HillType.REGULAR_HILLS,
                        caves: CaveType.NO_CAVES
                    };
                } else {
                    wk = WorldType.FLAT;
                }
                break;
            case GameType.FLAT:
                wk = WorldType.FLAT;
                break;
            case GameType.CUBE:
                wk = WorldType.CUBE;
                break;
            case GameType.UNSTRUCTURED:
            default:
                console.error('[Server/Model] Unsupported game type.');
                return;
        }

        worldInfo.kind = wk;
        switch (wk) {
            case WorldType.CUBE:
                switch (gameInfo.threeHillsType) {
                    case 0: worldInfo.hills = HillType.NO_HILLS; break;
                    case 1: worldInfo.hills = HillType.REGULAR_HILLS; break;
                    default: break;
                }
                worldInfo.sideSize = parseInt(gameInfo.size, 10);
                worldInfo.caves = CaveType.NO_CAVES;
                worldInfo.chunkSizes = ChunkSizes.CUBE_REGULAR;
                break;
            case WorldType.FLAT:
                worldInfo.kind = WorldType.FLAT;
                switch (gameInfo.flatHillsType) {
                    case 0: worldInfo.hills = HillType.NO_HILLS; break;
                    case 1: worldInfo.hills = HillType.REGULAR_HILLS; break;
                    case 2: worldInfo.hills = HillType.GIANT_HILLS; break;
                    case 3: worldInfo.hills = HillType.ERODED; break;
                    case 4: worldInfo.hills = HillType.SPIKES; break;
                    default: break;
                }
                switch (gameInfo.caves) {
                    case 0: worldInfo.caves = CaveType.NO_CAVES; break;
                    case 1: worldInfo.caves = CaveType.SUBSURFACE_CAVES; break;
                    default: break;
                }
                worldInfo.sideSize = -1; // infinite flat world
                worldInfo.chunkSizes = ChunkSizes.FLAT_REGULAR;
                break;
            case WorldType.SHRIKE:
            case WorldType.UNSTRUCTURED:
            default:
                console.error('[Server/Model] Unsupported world type.');
                return;
        }

        return worldInfo;
    }
}

export {
    WorldModel as default,
    WorldType, BlockType, HillType, CaveType, ChunkSizes,
    BlockTypes
};
