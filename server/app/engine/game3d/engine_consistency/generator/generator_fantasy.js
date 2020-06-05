
'use strict';

import { BlockType } from '../../model_world/model';

class FantasyGenerator
{
    static simpleFantasyGeneration(
        worldMap, chunk
    )
    {
        const d = chunk.dimensions;
        if (d[0] !== d[1] || d[1] !== d[2])
        {
            console.error('[FantasyGenerator] Only works on square chunks.');
        }
        const chunkSize = d[0];
        const tileSize = worldMap.tileDimension;
        const tileHalfSize = tileSize / 2;
        const chunksPerTile = tileSize / chunkSize;
        const ci = chunk.chunkI + tileHalfSize / chunksPerTile;
        const cj = chunk.chunkJ + tileHalfSize / chunksPerTile;
        const ck = chunk.chunkK;

        // Get tile from WorldMap if ready
        // If not, create one and command generation
        const tileI = Math.floor(ci / chunksPerTile);
        const tileJ = Math.floor(cj / chunksPerTile);
        let t = worldMap.makeNewTileIfNeeded(tileI, tileJ);
        if (t.needsGeneration)
        {
            return;
        }
        // console.log(worldMap);
        // console.log(chunk);

        const stone = BlockType.STONE;
        const grass = BlockType.GRASS;
        const water = BlockType.WATER;
        const sand = BlockType.SAND;
        const air = BlockType.AIR;

        // Get height buffer
        // Fill height and water
        let blocks = chunk.blocks;
        let heightBuffer = t.getRaster();
        const offsetI = ci * chunkSize;
        const offsetJ = cj * chunkSize;
        const offsetK = ck * chunkSize;
        const ijs = chunkSize * chunkSize;
        const idStart = offsetI * tileSize + offsetJ;

        for (let i = 0; i < chunkSize; ++i)
        {
            const offset = idStart + i * tileSize;
            for (let j = 0; j < chunkSize; ++j)
            {
                const h = heightBuffer[offset + j];
                const height = Math.floor(h < -20 ? h / 500 : h / 2) + 16;
                const oij = j * chunkSize + i;

                if (height > offsetK + chunkSize)
                {
                    for (let k = 0; k < chunkSize; ++k) {
                        const bi = ijs * k + oij;
                        blocks[bi] = stone;
                    }
                }
                else if (height < offsetK)
                {
                    if (offsetK > 16) {
                        for (let k = 0; k < chunkSize; ++k) {
                            const bi = ijs * k + oij;
                            blocks[bi] = air;
                        }
                    }
                    else if (offsetK + chunkSize < 16) {
                        for (let k = 0; k < chunkSize; ++k) {
                            const bi = ijs * k + oij;
                            blocks[bi] = water;
                        }
                    } else {
                        for (let k = 0; k < chunkSize; ++k) {
                            const bi = ijs * k + oij;
                            blocks[bi] = offsetK + k < 16 ? water : air;
                        }
                    }
                }
                else
                {
                    const h1 = height - offsetK - 2;
                    for (let k = 0; k < h1; ++k) {
                        const bi = ijs * k + oij;
                        blocks[bi] = stone;
                    }

                    const h2 = h1 + 2;
                    for (let k = h1; k < h2; ++k) {
                        const bi = ijs * k + oij;
                        blocks[bi] = height < 16 ? sand : grass;
                    }

                    for (let k = h2; k < chunkSize; ++k) {
                        const bi = ijs * k + oij;
                        blocks[bi] = offsetK + k < 16 ? water : air;
                    }
                }
            }
        }

        // Get overlay buffer
        // Fill trees and walls
        // let surfaceBuffer = t.getSurfaceRaster();
        chunk.blocksReady = true;
    }
}

export default FantasyGenerator;
