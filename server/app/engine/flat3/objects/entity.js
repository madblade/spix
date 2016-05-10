/**
 *
 */

'use strict';

class Entity {

    constructor(id) {
        this._position = null;
        this._id = id;
    }

    get id() { return this._id; }

    get position() { return this._position; }

    spawn() {
        this._position = [0,0,0];
    }

    die() {
        this._position = null;
    }

    move(x, y, z) {
        console.log('I move');
        this._position[0] += x;
        this._position[1] += y;
        this._position[2] += z;
    }

}

export default Entity;
