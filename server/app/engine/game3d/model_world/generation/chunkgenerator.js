/**
 *
 */

'use strict';

import Chunk from './../chunk';
import ExtractionAPI from './../../engine_consistency/builder/extractionapi';

import GenTest from './generator.test.js';
import GenAnalytic from './generator.analytic.js';
import GenSimple from './generator.simple.js';
import GenPerlin from './generator.perlin.js';
import GenSimplePerlin from './generator.simple-perlin.js';

class ChunkGenerator {

    static debug = false;

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call ExtractionAPI.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, worldModel) {
        console.log('createRawChunk ' + id);
        var c = new Chunk(x, y, z, id, worldModel);

        //GenTest.testChunk(c);
        //GenTest.testMerge(c);
        //GenSimple.fillChunk(c, 40, 1);
        //GenAnalytic.waveChunk(c, 40, 48, 1);
        try {
            // GenPerlin.perlinGeneration(c);
            GenSimplePerlin.simplePerlinGeneration(c);
        } catch (e) {
            console.log(e.stack);
        }

        return c;
    }

    static createChunk(x, y, z, id, worldModel) {
        //console.log('createChunk ' + id);
        var c = new Chunk(x, y, z, id, worldModel);

        //let generationMethod = worldModel.generationMethod;
        //if (generationMethod == 'flat') {
        //    GenSimple.fillChunk(c, 41, 1);
            //GenAnalytic.waveChunk(c, 10, 15, 1);
            GenSimplePerlin.simplePerlinGeneration(c);
            //GenSimple.fillChunk(c, 256, 0);
        //} else {
        //}

        //try {
        //    GenPerlin.perlinGeneration(c);
        //} catch (e) {
        //    console.log(e.stack);
        //}

        return c;
    }

}

export default ChunkGenerator;
