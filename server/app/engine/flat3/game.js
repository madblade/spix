/**
 *
 */

'use strict';

import Game from '../../model/game/game';
import Flat3Factory from './factory';

class Flat3 extends Game {

    constructor(hub, gameId, connector) {
        super(hub, gameId, connector);

        // Utility parameters
        this._kind = 'flat3';
        this._refreshRate = 16;

        // Setup managers.
        this._inputman = Flat3Factory.createUserInput(this);
        this._physics = Flat3Factory.createPhysics();
        this._objectman = Flat3Factory.createObjectManager();
        this._ai = Flat3Factory.createAI();
        this._outputman = Flat3Factory.createUserOutput(this);
        // super:_playerman

        // Generate then listen players.
        this._objectman.generate().then(() => this.configurePlayerManager());
    }

    configurePlayerManager() {
        this._playerman.setAddPlayerBehaviour((p) => {
            this._objectman.spawnPlayer(p);
            this._inputman.listenPlayer(p);
            this._outputman.init(p);
        });

        this._playerman.setRemovePlayerBehaviour((p) => {
            this._inputman.removePlayer(p);
            this._objectman.despawnPlayer(p);
        });

        this.ready = true;
    }

    // Model
    get playerman() { return this._playerman; }
    get objectman() { return this._objectman; }

    //^
    update() {
        this._inputman.update();    // First, update inputs
        this._physics.update();     // Update physical simulation
        this._objectman.update();   // Update board objects
        this._ai.update();          // Update perceptions, intents
        this._outputman.update();   // Send updates

        var n = this._playerman.nbPlayers;
        //console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");
    }

    save() {
        // TODO write world into file.
    }

}

export default Flat3;
