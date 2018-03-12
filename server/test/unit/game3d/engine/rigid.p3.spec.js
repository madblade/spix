/* eslint-disable */

import RigidBodiesPhase3 from '../../../../app/engine/game3d/engine_physics/solver/rigid_bodies/rigid_bodies_phase_3';

describe('Rigid solver routines (3):', function () {

    describe('Merge sub islands on X', function() {

        let island = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        let subIslandX = [[1, 3, 5], [8, 2, 10, 4]];
        // Second island got the most elements
        let subIslandY = [];
        let subIslandZ = [];
        let i = 5;
        let j = 10;
        let subIslandI = subIslandX[0];
        let subIslandJ = subIslandX[1];
        let objectInIslandToSubIslandXIndex = [-1, 0, 1, 0, 1, 0, -1, -1, 1, -1, 1];
        let objectInIslandToSubIslandYIndex = Array(11).fill(-1);
        let objectInIslandToSubIslandZIndex = Array(11).fill(-1);

        before(function(done) {
            RigidBodiesPhase3.mergeSubIslands(
                i, j, subIslandI, subIslandJ,
                objectInIslandToSubIslandXIndex,
                objectInIslandToSubIslandYIndex,
                objectInIslandToSubIslandZIndex,
                subIslandX,
                subIslandY,
                subIslandZ,
                'x');

            done();
        });

        it ('should have not changed sub islands', function() {
            subIslandX.length.should.equal(2);
        });

        it ('should have met 10 in objectInIslandToSubIslandXIndex', function() {
            let idOf10 = objectInIslandToSubIslandXIndex[5];
            idOf10.should.be.greaterThan(-1);
        });

        it ('should have followed and found 10 in the matching array', function() {
            let idOf10 = objectInIslandToSubIslandXIndex[10];
            idOf10.should.be.greaterThan(-1);
            idOf10.should.equal(1);
            subIslandX[idOf10].indexOf(10).should.be.greaterThan(-1);
        });

        it ('should also have spotted five at the same place', function() {
            let idOf10 = objectInIslandToSubIslandXIndex[10];
            idOf10.should.be.greaterThan(-1);
            subIslandX[idOf10].indexOf(10).should.be.greaterThan(-1);

            let idOf5 = objectInIslandToSubIslandXIndex[5];
            idOf5.should.be.greaterThan(-1);
            idOf5.should.equal(1);
            subIslandX[idOf5].indexOf(5).should.be.greaterThan(-1);

            idOf5.should.equal(idOf10);
        });

        it ('should have merged islands', function() {
            let idOf10 = objectInIslandToSubIslandXIndex[10];
            subIslandX[idOf10].length.should.equal(7);
            objectInIslandToSubIslandXIndex.length.should.equal(11);

            objectInIslandToSubIslandXIndex[0].should.equal(-1);
            objectInIslandToSubIslandXIndex[1].should.equal(idOf10);
            objectInIslandToSubIslandXIndex[2].should.equal(idOf10);
            objectInIslandToSubIslandXIndex[3].should.equal(idOf10);
            objectInIslandToSubIslandXIndex[4].should.equal(idOf10);
            objectInIslandToSubIslandXIndex[5].should.equal(idOf10);
            objectInIslandToSubIslandXIndex[6].should.equal(-1);
            objectInIslandToSubIslandXIndex[7].should.equal(-1);
            objectInIslandToSubIslandXIndex[8].should.equal(idOf10);
            objectInIslandToSubIslandXIndex[9].should.equal(-1);
            objectInIslandToSubIslandXIndex[10].should.equal(idOf10);
        });

    });
});
