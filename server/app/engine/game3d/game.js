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
        this._xModel            = new XModel(this);
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

    //^
    update() {
        // Idea maybe split in several loops (purposes).
        // let time = process.hrtime();

        /** Inputs **/
        this._ai.update();                // Update intents.

        this._externalInput.update();     // Update human inputs (not needed, done asynchronously).
        this._internalInput.update();     // Update artificial inputs.

        /** Updates **/
        this._topologyEngine.update();    // Update topological model.
        this._physicsEngine.update();     // Update physical simulation.
        this._consistencyEngine.update(); // Make client models consistent.

        /** Outputs **/
        this._externalOutput.update();    // Send updates.
        this._internalOutput.update();    // Update perceptions.

        // var n = this._playerManager.nbPlayers;
        // console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");

        // this._tt += 1;
        // if (this._tt % 1000 === 0) console.log((process.hrtime(time)[1]/1000) + " µs a loop.");
    }

    generate() {
        this._worldModel.generate()
            .then(_ => {
                this._playerManager.setAddPlayerBehaviour(p => {
                    this._entityModel.spawnPlayer(p);
                    this._consistencyModel.spawnPlayer(p);
                    this._externalInput.listenPlayer(p);
                    this._externalOutput.init(p);
                });

                this._playerManager.setRemovePlayerBehaviour(p => {
                    this._externalInput.removePlayer(p);
                    this._consistencyModel.removePlayer(p);
                    this._entityModel.despawnPlayer(p);
                });

                this._ready = true;
            })
            .catch(e => console.log(e));
    }

    save() {
        // TODO [LONG-TERM] write world into file.
    }

}

export default Game3D;
