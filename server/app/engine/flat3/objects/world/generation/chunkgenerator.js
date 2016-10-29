/**
 *
 */

'use strict';

import Chunk from './../chunk';
import ExtractionAPI from './../extraction/extractionapi';

import GenTest from './generator.test';
import GenAnalytic from './generator.analytic';
import GenSimple from './generator.simple';
import GenPerlin from './generator.perlin';

class ChunkGenerator {

    static debug = false;

    /**
     * N.B. the created chunks are in memory but not ready yet.
     * To finalize creation, add them into the manager model.
     * Then, call ExtractionAPI.computeFaces(chunk).
     */
    static createRawChunk(x, y, z, id, worldManager) {
        console.log('createRawChunk ' + id);
        var c = new Chunk(x, y, z, id, worldManager);

        //GenTest.testChunk(c);
        //GenTest.testMerge(c);
        //GenSimple.fillChunk(c, 40, 1);
        //GenAnalytic.waveChunk(c, 40, 48, 1);
        try {
            GenPerlin.perlinGeneration(c);
        } catch (e) {
            console.log(e.stack);
        }

        return c;
    }

    static createChunk(x, y, z, id, worldManager) {
        //console.log('createChunk ' + id);
        var c = new Chunk(x, y, z, id, worldManager);

        //let generationMethod = worldManager.generationMethod;
        //if (generationMethod == 'flat') {
            //GenSimple.fillChunk(c, 32, 1);
            GenAnalytic.waveChunk(c, 10, 15, 1);
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
