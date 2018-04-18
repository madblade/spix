/**
 *
 */

'use strict';

import Chunk            from './../../model_world/chunk';
import WorldType        from './../../model_world/model';

// import GenTest          from './generator_test.js';
// import GenAnalytic      from './generator_analytic.js';
// import GenSimple        from './generator_simple.js';
// import GenPerlin        from './generator_perlin.js';
import GenSimplePerlin  from './generator_simple_perlin.js';

class ChunkGenerator {

    static debug = false;

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call Extractor.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, world)
    {
        console.log(`createRawChunk ${id}`);
        let c = new Chunk(x, y, z, id, world);

        //GenTest.testChunk(c);
        //GenTest.testMerge(c);
        //GenSimple.fillChunk(c, 40, 1);
        //GenAnalytic.waveChunk(c, 40, 48, 1);
        //try {
            // GenPerlin.perlinGeneration(c);
        let shuffleChunks = false; // Can be set to activated to test for initial chunk.
        GenSimplePerlin.simplePerlinGeneration(c, shuffleChunks, world.worldId, world.worldType);
        //} catch (e) {
        //    console.log(e.stack);
        //}

        return c;
    }

    static createChunk(x, y, z, id, world)
    {
        let c = new Chunk(x, y, z, id, world);

        // let generationMethod = world.generationMethod;
        // switch (generationMethod) {
        // GenSimple.fillChunk(c, 41, 1);
        // GenAnalytic.waveChunk(c, 10, 15, 1);
        // GenSimple.fillChunk(c, 256, 0);
        // GenPerlin.perlinGeneration(c);
        GenSimplePerlin.simplePerlinGeneration(c, false, world.worldId, world.worldType); // params: chunk, doShuffleChunks

        return c;
    }

}

export default ChunkGenerator;
