/**
 *
 */

'use strict';

import Chunk            from './../../model_world/chunk';

import GenTest          from './generator_test.js';
import GenAnalytic      from './generator_analytic.js';
import GenSimple        from './generator_simple.js';
import GenPerlin        from './generator_perlin.js';
import GenSimplePerlin  from './generator_simple_perlin.js';

class ChunkGenerator {

    static debug = false;

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call Extractor.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, world) {
        console.log('createRawChunk ' + id);
        var c = new Chunk(x, y, z, id, world);

        //GenTest.testChunk(c);
        //GenTest.testMerge(c);
        //GenSimple.fillChunk(c, 40, 1);
        //GenAnalytic.waveChunk(c, 40, 48, 1);
        try {
            // GenPerlin.perlinGeneration(c);
            GenSimplePerlin.simplePerlinGeneration(c, false, world.worldId);
        } catch (e) {
            console.log(e.stack);
        }

        return c;
    }

    static createChunk(x, y, z, id, world) {

        var c = new Chunk(x, y, z, id, world);

        // let generationMethod = world.generationMethod;
        // switch (generationMethod) {
        // GenSimple.fillChunk(c, 41, 1);
        // GenAnalytic.waveChunk(c, 10, 15, 1);
        // GenSimple.fillChunk(c, 256, 0);
        // GenPerlin.perlinGeneration(c);
        GenSimplePerlin.simplePerlinGeneration(c, false, world.worldId); // params: chunk, doShuffleChunks

        return c;
    }

}

export default ChunkGenerator;
