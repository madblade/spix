/**
 *
 */

'use strict';

import Game             from '../../model/game/game';

import UserInput        from './io_user/input';
import UserOutput       from './io_user/output';
import AI               from './io_ai/ai';

import Physics          from './engine_physics/physics';

import EntityModel      from './model_entity/model';
import WorldModel       from './model_world/model';

import Chat             from './../../model/connection/chat';

class Game3D extends Game {

    constructor(hub, gameId, connector) {
        super(hub, gameId, connector);

        // Utility parameters
        this._kind = 'game3d';
        this._refreshRate = 16;
        this._tt = 0;

        // Models.
        //this._worldModel;       //
        //this._entityModel;      //
        //this._xModel;           //

        // Engines.
        //this._topologyEngine;   //
        //this._physicsEngine;    //

        // I/O.
        //this._internalInput;            // A.I.
        //this._externalInput;            // Users.

        //this._internalOutput;           // A.I.
        //this._externalOutput;           // Users.


        // Setup managers.
        this._inputman = new UserInput(this);
        this._outputman = new UserOutput(this);

        this._worldman =  new WorldModel(gameId);
        this._entityman = new EntityModel(this._worldman);
        this._worldman.entityman = this._entityman;

        this._chat = new Chat(this);
        this._physics = new Physics(this._entityman, this._worldman);
        this._ai = new AI();
        // super:_playerManager

        // Generate then listen players.
        this._worldman.generate()
            .then(_ => this.configurePlayerManager())
            .catch(e => console.log(e));
    }

    configurePlayerManager() {
        let playerman = this._playerManager;

        playerman.setAddPlayerBehaviour(p => {
            this._entityman.spawnPlayer(p);
            this._inputman.listenPlayer(p);
            this._outputman.init(p);
        });

        playerman.setRemovePlayerBehaviour(p => {
            this._inputman.removePlayer(p);
            this._entityman.despawnPlayer(p);
        });

        this._ready = true;
    }

    // Model
    get players() { return this._playerManager; }
    get entityModel() { return this._entityman; }
    get worldModel() { return this._worldman; }
    get physics() { return this._physics; }
    get chat() { return this._chat; }

    //^
    update() {
        // Idea maybe split in several loops (purposes).
        // let time = process.hrtime();

        this._inputman.update();    // First, update inputs.
        this._physics.update();     // Update physical simulation.
        this._entityman.update();   // Update entities.
        this._worldman.update();    // Update blocks.
        this._ai.update();          // Update perceptions, intents.
        this._outputman.update();   // Send updates.

        // var n = this._playerManager.nbPlayers;
        // console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");

        // this._tt += 1;
        // if (this._tt % 1000 === 0) console.log((process.hrtime(time)[1]/1000) + " µs a loop.");
    }

    save() {
        // TODO write world into file.
    }

}

export default Game3D;
