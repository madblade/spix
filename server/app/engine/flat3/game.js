/**
 *
 */

'use strict';

import Game from '../../model/game/game';
import Flat3Factory from './factory';

class Flat3 extends Game {

    constructor(gameId, connector) {
        super(gameId, connector);

        // Utility parameters
        this._kind = 'flat3';
        this._refreshRate = 100;

        // Setup managers
        this._physics = Flat3Factory.createPhysics();
        this._input = Flat3Factory.createUserInput();
        this._ai = Flat3Factory.createAI();
        this._objectman = Flat3Factory.createObjectManager();

        // Setup behaviours
        this.configurePlayerManager();
    }

    configurePlayerManager() {
        this._playerman.setAddPlayerBehaviour((p)=> {

        });

        this._playerman.setRemovePlayerBehaviour((p)=> {

        });
    }

    // Model
    get playerman() { return this._playerman; }

    //^
    update() {
        // First, update inputs
        this._input.update();
        this._ai.update();
        this._physics.update();
        this._objectman.update();

        console.log("There are " + this._playerman.nbPlayers + " players connected.");
        //this._players.forEach((p) => {
        //    p.send('stamp', this._terrain);
        //});
    }

}

export default Flat3;
