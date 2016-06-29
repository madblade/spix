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

    spawn(position) {
        this._position = position;
        this._rotation = [0, Math.PI/2];
        this._directions = [false, false, false, false];
    }

    die() {
        this._position = null;
    }

    stop() { this._directions = [false, false, false, false]; }

    goForward()     { this._directions[0] = true; }
    goRight()       { this._directions[1] = true; }
    goLeft()        { this._directions[2] = true; }
    goBackwards()   { this._directions[3] = true; }

    stopForward()   { this._directions[0] = false; }
    stopRight()     { this._directions[1] = false; }
    stopLeft()      { this._directions[2] = false; }
    stopBackwards() { this._directions[3] = false; }

    move(entityManager) {
        const theta = this._rotation[0];
        const ds = this._directions;
        var desiredSpeed = [0, 0, 0];
        if (ds[0] && !ds[1] && !ds[2] && !ds[3]) { // forward
            desiredSpeed[0] = -Math.sin(theta);
            desiredSpeed[1] = Math.cos(theta);
        } else if (!ds[0] && ds[1] && !ds[2] && !ds[3]) { // right
            desiredSpeed[0] = Math.cos(theta);
            desiredSpeed[1] = Math.sin(theta);
        } else if (!ds[0] && !ds[1] && ds[2] && !ds[3]) { // left
            desiredSpeed[0] = -Math.cos(theta);
            desiredSpeed[1] = -Math.sin(theta);
        } else if (!ds[0] && !ds[1] && !ds[2] && ds[3]) { // backwards
            desiredSpeed[0] = Math.sin(theta);
            desiredSpeed[1] = -Math.cos(theta);
        }

        // Notify an entity was updated.
        if ((ds[0]!==ds[3]) || (ds[1]!==ds[2])) entityManager.entityUpdated(this._id);

        for (let i = 0; i<3; ++i) this._position[i] += 0.1 * desiredSpeed[i];
    }

    rotate(p, y) {
        this._rotation[0] = p;
        this._rotation[1] = y;
    }

}

export default Entity;
