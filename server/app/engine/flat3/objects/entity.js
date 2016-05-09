/**
 *
 */

'use strict';

class Entity {

    constructor() {
        this.position = null;
    }

    spawn() {
        this.position = [0,0,0];
    }

    die() {
        this.position = null;
    }

    move(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }

}

export default Entity;
