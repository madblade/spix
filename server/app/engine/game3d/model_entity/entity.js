/**
 *
 */

'use strict';

class Entity {

    constructor(id) {
        // Properties
        this._entityId      = id;
        this._kind          = 'abstract';

        // Inputs
        this._directions    = null;

        // NEW physics engine
        this._p0            = [0, 0, 0];
        this._p1            = [0, 0, 0];
        this._v0            = [0, 0, 0];
        this._v1            = [0, 0, 0];
        this._a0            = [0, 0, 0];
        this._a1            = [0, 0, 0];
        
        this._p01           = [0, 0, 0];
        this._v01           = [0, 0, 0];
        this._a01           = [0, 0, 0];
        this._delta01       = 0;
        
        this._d             = [!0, !0, !0, !0, !0, !0];
        this._r             = [0, 0, 0, 0]; // rel, abs
        //this._rrel          = [0, 0];
        //this._rabs          = [0, 0];
        
        this._metaX         = null;
        
        this._capS          = .005;
        this._capW          = .01;
        this._capR          = .03;
        
        // LEGACY PhysicsEngine
        this._rotation      = null;
        this._directions    = null;
        this._position      = null;
        this._speed         = null;
        this._acceleration  = null;
        this._mass          = 1;
        this._adherence     = [!1, !1, !1, // Right, Into, Up
                               !1, !1, !1]; // Left, From, Down

        this._impulseSpeedStamp = null;
        this._needsEuler        = true;

        // Situation.
        // Barycenter.
        this._worldId       = -1;
        // When crossing multiple portals...
        // 1 state = Object { position:p, rotation:r }
        this._otherWorlds = new Map(); // TODO [LONG-TERM]
        
        // Linked events.
        this._events = [];
        
        // Physics/consistency optimization.
        this._indexX      = -1;
        this._indexY      = -1;
        this._indexZ      = -1;
        this._dtr         = 1.;
        // Hit box.
        this._widthX      = .25; // -> .5 
        this._widthY      = .25; // -> .5
        this._widthZ      = .9;  // -> 1.6
    }
    
    static maxWidth = 10.; // 10 blocks.
    static maxSpeed = 10.;  // 1 blocks per time unit.

    get entityId()          { return this._entityId; }
    get kind()              { return this._kind; }
    get worldId()           { return this._worldId; }
    set worldId(nwi)        { this._worldId = nwi; }
    
    get dtr()               { return this._dtr; }
    set dtr(dtr)            { this._dtr = dtr; }
    
    //get rotation()          { return this._rotation; }
    get rotation()          { return this._r; }
    //get position()          { return this._position; }
    get position()          { return this._p0; }
    
    get directions()        { return this._directions; }
    get speed()             { return this._speed; }
    get acceleration()      { return this._acceleration; }
    get mass()              { return this._mass; }
    get adherence()         { return this._adherence; }
    get otherWorlds()       { return this._otherWorlds; }
    get _impulseSpeed()     { return this._impulseSpeedStamp; }
    
    set adherence(na)       { this._adherence = na; }
    
    //set rotation(nr)        { this._rotation = nr; }
    set rotation(nr)        { this._r = nr; }
    //set position(np)        { this._position = np; }
    set position(np)        { this._p0 = np; }
    
    set speed(ns)           { this._speed = ns; }
    
    set acceleration(na)    { this._acceleration = na; }
    
    set _impulseSpeed(nis)  { this._impulseSpeedStamp = nis; }

    jump(direction) {
        this._adherence[direction] = false;
    }

    spawn(position, worldId) {
        this._worldId           = worldId;
        
        this._position          = position;
        this._rotation          = [0, Math.PI/2];
        this._directions        = [!1, !1, !1, !1, !1, !1];
        this._speed             = [0, 0, 0];
        this._acceleration      = [0, 0, 0];
        this._impulseSpeedStamp = [0, 0, 0];
        
        this._p                 = position;
        this._r                 = [0, Math.PI/2, 0, 0];
        this._d                 = [!1, !1, !1, !1, !1, !1];
        
        this._p0 = [0, 0, 0];   this._p1 = [0, 0, 0];
        this._v0 = [0, 0, 0];   this._v1 = [0, 0, 0];
        this._a0 = [0, 0, 0];   this._a1 = [0, 0, 0];
        this._nu = [0, 0, 0];
        
        this._p0 = position;
    }

    die() {
        this._position          = null;
        this._rotation          = null;
        this._speed             = null;
        this._directions        = null;
    }

    stop() {
        //this._directions = [!1, !1, !1, !1, !1, !1];
        this._d = [!1, !1, !1, !1, !1, !1];
        this._impulseSpeedStamp = [0, 0, 0];
        console.log("Entity stopping.");
    }

    //goForward()     { this._directions[0] = true; }
    //goRight()       { this._directions[1] = true; }
    //goLeft()        { this._directions[2] = true; }
    //goBackwards()   { this._directions[3] = true; }
    //goUp()          { this._directions[4] = true; }
    //goDown()        { this._directions[5] = true; }
    
    goForward()     { this._d[0] = !0; }
    goBackwards()   { this._d[1] = !0; }
    goRight()       { this._d[2] = !0; }
    goLeft()        { this._d[3] = !0; }
    goUp()          { this._d[4] = !0; }
    goDown()        { this._d[5] = !0; }

    //stopForward()   { this._directions[0] = false; }
    //stopRight()     { this._directions[1] = false; }
    //stopLeft()      { this._directions[2] = false; }
    //stopBackwards() { this._directions[3] = false; }
    //stopUp()        { this._directions[4] = false; }
    //stopDown()      { this._directions[5] = false; }
    stopForward()   { this._d[0] = !1; }
    stopBackwards() { this._d[1] = !1; }
    stopRight()     { this._d[2] = !1; }
    stopLeft()      { this._d[3] = !1; }
    stopUp()        { this._d[4] = !1; }
    stopDown()      { this._d[5] = !1; }

    rotate(relPitch, relYaw, absPitch, absYaw) {
        //this._rotation[0] = p;
        //this._rotation[1] = y;
        this._r[0] = relPitch;
        this._r[1] = relYaw;
        this._r[2] = absPitch;
        this._r[3] = absYaw;
    }

    // Physics.
    set indexX(indexX)      { this._indexX = indexX; }
    get indexX()            { return this._indexX; }
    set indexY(indexY)      { this._indexY = indexY; }
    get indexY()            { return this._indexY; }
    set indexZ(indexZ)      { this._indexZ = indexZ; }
    get indexZ()            { return this._indexZ; }
    
    get widthX()            { return this._widthX; }
    set widthX(widthX)      { this._widthX = widthX; }
    get widthY()            { return this._widthY; }
    set widthY(widthY)      { this._widthY = widthY; }
    get widthZ()            { return this._widthZ; }
    set widthZ(widthZ)      { this._widthZ = widthZ; }
    
    get metaX()             { return this._metaX; }
    set metaX(metaX)        { this._metaX = metaX; }
    
    get a0()                { return this._a0; }
    set a0(a0)              { this._a0 = a0; }
    get a1()                { return this._a1; }
    set a1(a1)              { this._a1 = a1; }
    get v0()                { return this._v0; }
    set v0(v0)              { this._v0 = v0; }
    get v1()                { return this._v1; }
    set v1(v1)              { this._v1 = v1; }
    get p0()                { return this._p0; }
    set p0(p0)              { this._p0 = p0; }
    get p1()                { return this._p1; }
    set p1(p1)              { this._p1 = p1; }
    
    get p01()               { return this._p01; }
    get v01()               { return this._v01; }
    get a01()               { return this._a01; }
    set p01(p01)            { this._p01 = p01; }
    set v01(v01)            { this._v01 = v01; }
    set a01(a01)            { this._a01 = a01; }
    get delta01()           { return this._delta01; }
    set delta01(delta01)    { this._delta01 = delta01; }
    copyP01() {
        for (let i = 0; i < 0; ++i) {
            this._p01[i] = this._p0[i];
            this._v01[i] = this._v0[i];
            this._a01[i] = this._a0[i];
        }
    }
    
    get nu()                { return this._nu; }
    set nu(nu)              { this._nu = nu; }
    
    //get rabs()                { return this._rabs; }
    //set rabs(up)              { this._rabs = up; }
    
    get d()                 { return this._d; }
    set d(d)                { this._d = d; }
    get r()                 { return this._r; }
    set r(r)                { this._r = r; }
    get stealthVelocity()   { return this._capS; }
    get walkVelocity()      { return this._capW; }
    get runVelocity()       { return this._capR; }
    set stealthVelocity(v)  { this._capS = v; }
    set walkVelocity(v)     { this._capW = v; }
    set runVelocity(v)      { this._capR = v; }
    
    getVelocity() {
        return this.walkVelocity;
    }
    
}

export default Entity;
