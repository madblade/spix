/**
 *
 */

'use strict';

class Entity {

    constructor(id) {
        // Properties
        this._id            = id;
        this._kind          = 'abstract';

        // Inputs
        this._directions    = null;

        // PhysicsEngine
        this._rotation      = null;
        this._position      = null;
        this._speed         = null;
        this._acceleration  = null;
        this._mass          = 1;
        this._adherence     = [ false, false, false, // Right, Into, Up
                                false, false, false]; // Left, From, Down

        this._impulseSpeedStamp = null;
        this._needsEuler        = true;

        // Situation.
        // Barycenter.
        this._worldId       = -1;
        // When crossing multiple portals...
        // 1 state = Object { position:p, rotation:r }
        this._otherStates = new Map();
    }

    get id()                { return this._id; }
    get kind()              { return this._kind; }

    get directions()        { return this._directions; }

    get rotation()          { return this._rotation; }
    get position()          { return this._position; }
    get speed()             { return this._speed; }
    get acceleration()      { return this._acceleration; }
    get mass()              { return this._mass; }
    get _impulseSpeed()     { return this._impulseSpeedStamp; }
    get worldId()           { return this._worldId; }
    get otherStates()       { return this._otherStates; }

    set adherence(na)       { this._adherence = na; }
    set rotation(nr)        { this._rotation = nr; }
    set position(np)        { this._position = np; }
    set speed(ns)           { this._speed = ns; }
    set acceleration(na)    { this._acceleration = na; }
    set _impulseSpeed(nis)  { this._impulseSpeedStamp = nis; }
    set worldId(nwi)        { this._worldId = nwi; }

    get adherence()         { return this._adherence; }

    jump(direction) {
        this._adherence[direction] = false;
    }

    spawn(position, worldId) {
        this._worldId           = worldId;
        this._position          = position;
        this._rotation          = [0, Math.PI/2];
        this._directions        = [false, false, false, false, false, false];
        this._speed             = [0, 0, 0];
        this._acceleration      = [0, 0, 0];
        this._impulseSpeedStamp = [0, 0, 0];
    }

    die() {
        this._position          = null;
        this._rotation          = null;
        this._speed             = null;
        this._directions        = null;
    }

    stop() {
        this._directions = [false, false, false, false, false, false];
        this._impulseSpeedStamp = [0, 0, 0];
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
