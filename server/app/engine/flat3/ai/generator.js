/**
 *
 */

'use strict';

class Generator {

    static generateFlatWorld() {
        var chunks, blocks, entities;

        // 1 chunk = 16x16 blocks.
        // Load 4 first chunks.
        chunks = [
            [0,0],
            [0,-1],
            [-1,-1],
            [-1,0]
        ];

        // The VERY naive way. (ugly berk) // TODO remove asap
        blocks = [
            // [1,0,0,0] // id, x, y, z
        ];

        for (var i = -16; i < 16; ++i)
            for (var j = -16; j < 16; ++j)
                blocks.push([1, i, j, 0]);

        // Nobody in the world yet.
        entities = [];

        return [chunks, blocks, entities];
    }

    static generatePerlinWorld() {
        return [[], [], []];
    }

}

export default Generator;
