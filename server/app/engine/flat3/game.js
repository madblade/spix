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
        this._refreshRate = 100;

        // Setup managers
        this._inputman = Flat3Factory.createUserInput();
        this._outputman = Flat3Factory.createUserOutput(this, this._playerman);
        this._physics = Flat3Factory.createPhysics();
        this._ai = Flat3Factory.createAI();

        // TODO put in a special location for performance.
        this._objectman = Flat3Factory.createObjectManager();
        // super:_playerman

        // Setup behaviours
        this.configurePlayerManager();
    }

    configurePlayerManager() {
        this._playerman.setAddPlayerBehaviour((p) => {
            this._objectman.spawnPlayer(p);
            this._inputman.listenPlayer(p);
        });

        this._playerman.setRemovePlayerBehaviour((p) => {
            this._inputman.removePlayer(p);
            this._objectman.despawnPlayer(p);
        });
    }

    // Model
    get playerman() { return this._playerman; }
    get world() { return this._objectman.world; }

    //^
    update() {
        this._inputman.update();    // First, update inputs
        this._physics.update();     // Update physical simulation
        this._objectman.update();   // Update board objects
        this._ai.update();          // Update perceptions, intents

        this._outputman.update(this._objectman.world);   // Send updates

        var n = this._playerman.nbPlayers;
        //console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");
    }

}

export default Flat3;
