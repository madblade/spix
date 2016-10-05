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

    move(entityManager, worldManager) {
        const theta = this._rotation[0];
        const ds = this._directions;
        var desiredSpeed = [0, 0, (ds[4]&&!ds[5])?1:(ds[5]&&!ds[4])?-1:0];

        if (ds[0] && !ds[3]) { // forward quarter
            let theta2 = theta;
            if (ds[1] && !ds[2]) theta2 -= Math.PI/4; // right
            else if (ds[2] && !ds[1]) theta2 += Math.PI/4; // left
            desiredSpeed[0] = -Math.sin(theta2);
            desiredSpeed[1] = Math.cos(theta2);

        } else if (ds[3] && !ds[0]) { // backward quarter
            let theta2 = theta;
            if (ds[1] && !ds[2]) theta2 += Math.PI/4; // right
            else if (ds[2] && !ds[1]) theta2 -= Math.PI/4; // left
            desiredSpeed[0] = Math.sin(theta2);
            desiredSpeed[1] = -Math.cos(theta2);

        } else if (ds[1] && !ds[2]) { // exact right
            desiredSpeed[0] = Math.cos(theta);
            desiredSpeed[1] = Math.sin(theta);

        } else if (ds[2] && !ds[1]){ // exact left
            desiredSpeed[0] = -Math.cos(theta);
            desiredSpeed[1] = -Math.sin(theta);
        }

        if ((ds[0]!==ds[3]) || (ds[1]!==ds[2]) || ds[4]!==ds[5]) {
            // Notify an entity was updated.
            entityManager.entityUpdated(this._id);

            // Update.
            let newPosition = [this._position[0], this._position[1], this._position[2]];
            for (let i = 0; i<3; ++i) newPosition[i] += 0.1 * desiredSpeed[i];

            // Collide.
            if (worldManager.isEmpty(newPosition)) {
                this._position = newPosition;
            }
        }
    }

    rotate(p, y) {
        this._rotation[0] = p;
        this._rotation[1] = y;
    }

}

export default Entity;
