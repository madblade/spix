/**
 *
 */

'use strict';

import Game              from '../../model/game/game';

import UserInput         from './io_user/input/input';
import UserOutput        from './io_user/output/output';
import AIInput           from './io_ai/input/input';
import AIOutput          from './io_ai/output/output';
import AI                from './io_ai/ai';

import PhysicsEngine     from './engine_physics/physics';
import TopologyEngine    from './engine_topology/topology';
import ConsistencyEngine from './engine_consistency/consistency';

import EntityModel      from './model_entity/model';
import WorldModel       from './model_world/model';
import XModel           from './model_x/model';
import ConsistencyModel from './model_consistency/model';

import Chat             from './../../model/connection/chat';

class Game3D extends Game {

    constructor(hub, gameId, connector) {
        super(hub, gameId, connector);

        // Utility parameters
        this._kind = 'game3d';
        this._refreshRate = 16;
        this._tt = 0;

        // Misc.
        this._chat = new Chat(this);

        // Models (autonomous).
        this._worldModel        = new WorldModel(this);
        this._entityModel       = new EntityModel(this);
        this._xModel            = new XModel(this);     // Needs world model.
        this._consistencyModel  = new ConsistencyModel(this);

        // Engines (need models).
        this._ai                = new AI(this);
        this._physicsEngine     = new PhysicsEngine(this);
        this._topologyEngine    = new TopologyEngine(this);
        this._consistencyEngine = new ConsistencyEngine(this);

        // I/O (need engines).
        this._internalInput     = new AIInput(this);    // A.I.
        this._internalOutput    = new AIOutput(this);   // A.I.
        this._externalInput     = new UserInput(this);  // Human.
        this._externalOutput    = new UserOutput(this); // Human.

        // Generate then listen players.
        this.generate();
    }

    // Model

    get entityModel()       { return this._entityModel; }
    get worldModel()        { return this._worldModel; }
    get xModel()            { return this._xModel; }
    get consistencyModel()  { return this._consistencyModel; }

    get physicsEngine()     { return this._physicsEngine; }
    get topologyEngine()    { return this._topologyEngine; }
    get consistencyEngine() { return this._consistencyEngine; }

    get chat()              { return this._chat; }

    static bench = false;

    //^
    update() {
        // Idea maybe split in several loops (purposes).
        let t;
        let dt1, dt2, dt3, dt4, dt5;
        let debugThresh = 1000; // ms

        /** Inputs **/
        t = process.hrtime();
        this._ai.update();                // Update intents.
        dt1 = (process.hrtime(t)[1]/1000);
        if (Game3D.bench && dt1 > debugThresh) console.log(dt1 +' µs to update intents.');

        t = process.hrtime();
        this._externalInput.update();     // Update human spawn/leave requests.
        this._internalInput.update();     // Update artificial inputs.
        dt2 = (process.hrtime(t)[1]/1000);
        if (Game3D.bench && dt2 > debugThresh) console.log(dt2 +' µs to update inputs.');

        /** Updates **/
        t = process.hrtime();
        this._topologyEngine.update();    // Update topological model.
        this._physicsEngine.update();     // Update physical simulation.
        dt3 = (process.hrtime(t)[1]/1000);
        if (Game3D.bench && dt3 > debugThresh) console.log(dt3 +' µs to update engines.');

        /** Consistency solving: mediator between player and server models **/
        t = process.hrtime();
        this._consistencyEngine.update(); // Make client models consistent. Needs other engines.
        dt4 = (process.hrtime(t)[1]/1000);
        if (Game3D.bench && dt4 > debugThresh) console.log(dt4 +' µs to update consistency.');

        /** Outputs **/
        t = process.hrtime();
        this._externalOutput.update();    // Send updates.
        this._internalOutput.update();    // Update perceptions.
        dt5 = (process.hrtime(t)[1]/1000);
        if (Game3D.bench && dt5 > debugThresh) console.log(dt5 +' µs to update outputs.');

        // var n = this._playerManager.nbPlayers;
        // console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");
        // this._tt += 1;
        // if (this._tt % 1000 === 0) console.log((process.hrtime(time)[1]/1000) + " µs a loop.");
    }

    generate() {
        this._consistencyEngine.generateWorld()
            .then(() => {
                this._playerManager.setAddPlayerBehaviour(p => {
                    this._externalInput.addPlayer(p);
                });

                this._playerManager.setRemovePlayerBehaviour(player => {
                    this._externalInput.removePlayer(player.avatar.entityId);
                });

                this._ready = true;
            })
            .catch(e => console.log(e));
    }

    save() {
        // TODO [LONG-TERM] write world and entities into file.
    }

}

export default Game3D;
