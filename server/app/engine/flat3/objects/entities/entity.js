/**
 *
 */

'use strict';

class Entity {

    constructor(id) {
        this._position = null;
        this._rotation = null;
        this._directions = null; // for players
        this._id = id;
    }

    get id() { return this._id; }
    get position() { return this._position; }
    get rotation() { return this._rotation; }
    get directions() { return this._directions; }
    set position(np) { this._position = np; }

    spawn(position) {
        this._position = position;
        this._rotation = [0, Math.PI/2];
        this._directions = [false, false, false, false, false, false];
    }

    die() {
        this._position = null;
    }

    stop() {
        this._directions = [false, false, false, false, false, false];
        console.log("Entity stopping.");
    }

    goForward()     { this._directions[0] = true; }
    goRight()       { this._directions[1] = true; }
    goLeft()        { this._directions[2] = true; }
    goBackwards()   { this._directions[3] = true; }
    goUp()          { this._directions[4] = true; }
    goDown()        { this._directions[5] = true; }

    stopForward()   { this._directions[0] = false; }
    stopRight()     { this._directions[1] = false; }
    stopLeft()      { this._directions[2] = false; }
    stopBackwards() { this._directions[3] = false; }
    stopUp()        { this._directions[4] = false; }
    stopDown()      { this._directions[5] = false; }

    rotate(p, y) {
        this._rotation[0] = p;
        this._rotation[1] = y;
    }

}

export default Entity;
