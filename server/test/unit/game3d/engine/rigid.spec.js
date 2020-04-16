/* eslint-disable */
var should = require('chai').should();

import RigidBodies      from '../../../../app/engine/game3d/engine_physics/solver/rigid_bodies/rigid_bodies';
import EventOrderer     from '../../../../app/engine/game3d/engine_physics/solver/rigid_bodies/orderer_events';
import ObjectOrderer    from '../../../../app/engine/game3d/engine_physics/solver/rigid_bodies/orderer_objects';
import Game3D           from '../../../../app/engine/game3d/game';
import EntityModel      from '../../../../app/engine/game3d/model_entity/model';
import WorldModel       from '../../../../app/engine/game3d/model_world/model';
import XModel           from '../../../../app/engine/game3d/model_x/model';
import OutputBuffer     from '../../../../app/engine/game3d/engine_physics/output_buffer';

describe('Rigid (AABB) solver routines:', function () {
    let game3d;

    let rigidBodies;
    let objectOrderer;
    let eventOrderer;

    let entityModel;
    let worldModel;
    let xModel;

    let outputBuffer;
    let timeStepDuration;

    // Clear users before testing
    before(function(done) {
        game3d = new Game3D();
        rigidBodies = new RigidBodies();
        timeStepDuration = Game3D.serverRefreshRate;

        // No game object.
        worldModel = new WorldModel(null);
        entityModel = new EntityModel(null);
        xModel = new XModel(null, worldModel);

        // Here push random objects in models.
        // ...

        outputBuffer  = new OutputBuffer();
        objectOrderer = new ObjectOrderer(entityModel, xModel);
        eventOrderer = new EventOrderer();
        objectOrderer.orderObjects();

        done();
    });

    describe('Model of', function() {

        beforeEach(function(done) {
            done();
        });

        it ('worlds should contain the initial world only.', function() {
            worldModel.worlds.size.should.equal(1);
        });
        it ('entities should be empty.', function() {
            entityModel.entities.length.should.equal(0);
        });
        it ('x should be empty.', function() {
            xModel.portals.size.should.equal(0);
        });
    });

    describe('Bip', function() {
        beforeEach(function (done) {
            done();
        });

        //     afterEach(function () {
        //         joined = false;
        //     });

        it('should ', function () {
            true.should.equal(true);
        });
    });

    // Clear BDD after testing
    after(function(done) {
        // return Table.removeAsync();
        done();
        process.exit(); // This is to remove hooks, to call last
    });
});
