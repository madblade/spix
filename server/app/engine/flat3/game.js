/**
 *
 */

'use strict';

import Game from '../../model/game/game';
import Flat3Factory from './flat3factory';

class Flat3 extends Game {

    constructor(hub, gameId, connector) {
        super(hub, gameId, connector);

        // Utility parameters
        this._kind = 'flat3';
        this._refreshRate = 16;
        this._tt = 0;

        // Setup managers.
        this._inputman = Flat3Factory.createUserInput(this);
        this._worldman =  Flat3Factory.createWorldManager();
        this._entityman = Flat3Factory.createEntityManager(this._worldman);
        this._worldman.entityman = this._entityman;
        this._physics = Flat3Factory.createPhysics(this._entityman, this._worldman);
        this._ai = Flat3Factory.createAI();
        this._outputman = Flat3Factory.createUserOutput(this);
        // super:_playerman

        // Generate then listen players.
        this._worldman.generate().then(() => this.configurePlayerManager());
    }

    configurePlayerManager() {
        this._playerman.setAddPlayerBehaviour((p) => {
            this._entityman.spawnPlayer(p);
            this._inputman.listenPlayer(p);
            this._outputman.init(p);
        });

        this._playerman.setRemovePlayerBehaviour((p) => {
            this._inputman.removePlayer(p);
            this._entityman.despawnPlayer(p);
        });

        this.ready = true;
    }

    // Model
    get playerman() { return this._playerman; }
    get entityman() { return this._entityman; }
    get worldman() { return this._worldman; }

    //^
    update() {
        // TODO maybe split in several loops (purposes).
        let time = process.hrtime();

        this._inputman.update();    // First, update inputs.
        this._physics.update();     // Update physical simulation.
        this._entityman.update();   // Update entities.
        this._worldman.update();    // Update blocks.
        this._ai.update();          // Update perceptions, intents.
        this._outputman.update();   // Send updates.

        // var n = this._playerman.nbPlayers;
        // console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");

        // this._tt += 1;
        // if (this._tt % 1000 === 0) console.log((process.hrtime(time)[1]/1000) + " µs a loop.");
    }

    save() {
        // TODO write world into file.
    }

}

export default Flat3;
