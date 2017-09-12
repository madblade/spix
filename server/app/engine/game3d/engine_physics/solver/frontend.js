/**
 *
 */

'use strict';

import RigidBodies from './rigid_bodies/rigid_bodies';
import EventOrderer from './rigid_bodies/orderer_events';
import ObjectOrderer from './rigid_bodies/orderer_objects';

class FrontEnd {

    constructor(physicsEngine, refreshRate) {
        // Model access.
        this._physicsEngine = physicsEngine;
        let entityModel = physicsEngine.entityModel,
            xModel = physicsEngine.xModel;
        
        // Internals.
        this._rigidBodies   = new RigidBodies(refreshRate);
        this._objectOrderer = new ObjectOrderer(entityModel, xModel);
        this._eventOrderer  = new EventOrderer();
        this._stamp         = process.hrtime();
        
        // Note! this must be done before the first physics pass,
        // when entities are just loaded from the disk during a (to be implemented) resume.
        this._objectOrderer.orderObjects();
    }
    
    get objectOrderer() { return this._objectOrderer; }
    get eventOrderer()  { return this._eventOrderer; }

    solve() {
        
        let physicsEngine = this._physicsEngine,
            rigidBodies = this._rigidBodies,
            objectOrderer = this._objectOrderer,
            eventOrderer = this._eventOrderer;
        
        let em = physicsEngine.entityModel,
            wm = physicsEngine.worldModel,
            xm = physicsEngine.xModel,
            ob = physicsEngine.outputBuffer;
        
        // Compute adaptive time step.
        let relativeDt = process.hrtime(this._stamp)[1] / 1e6;
        
        // Solve physics constraints with basic ordering optimization.
        let maxTimeStepDuration = rigidBodies.refreshRate;
        let numberOfEntirePasses = relativeDt > maxTimeStepDuration ? Math.floor(relativeDt/maxTimeStepDuration) : 0;
        for (let t = 0; t < numberOfEntirePasses; ++t) {
            rigidBodies.solve(objectOrderer, eventOrderer, em, wm, xm, ob, maxTimeStepDuration);
        }
        
        let remainder = relativeDt - numberOfEntirePasses*maxTimeStepDuration;
        if (remainder < 0) {
            throw Error('[Physics/FrontEnd] Time sub-quantization error.');
        }
        if (remainder > relativeDt*.75) {
            rigidBodies.solve(objectOrderer, eventOrderer, em, wm, xm, ob, remainder);
            ++numberOfEntirePasses;
        }
        
        // console.log('######### Current physics passes: ' + numberOfEntirePasses + ' #########');
        
        // Stamp.
        this._stamp = process.hrtime();
    
    }

    // Can be triggered to change physics behaviour.
    shuffleGravity() {
        let rigidBodies = this._rigidBodies;
        let g = rigidBodies.gravity;
        rigidBodies.gravity = [g[2], g[0], g[1]];   
    }

}

export default FrontEnd;
