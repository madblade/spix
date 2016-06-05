/**
 *
 */

'use strict';

class Entity {

    constructor(id) {
        this._position = null;
        this._rotation = null;
        this._id = id;
    }

    get id() { return this._id; }

    get position() { return this._position; }

    get rotation() { return this._rotation; }

    spawn() {
        this._position = [0,0,0];
        this._rotation = [0,0];
    }

    die() {
        this._position = null;
    }

    moveForward() {
        const theta = this._rotation[0];
        this.move(-Math.sin(theta), Math.cos(theta), 0);
    }

    moveRight() {
        const theta = this._rotation[0];
        this.move(Math.cos(theta), Math.sin(theta), 0);
    }

    moveLeft() {
        const theta = this._rotation[0];
        this.move(-Math.cos(theta), -Math.sin(theta), 0);
    }

    moveBackwards() {
        const theta = this._rotation[0];
        this.move(Math.sin(theta), -Math.cos(theta), 0);
    }

    move(x, y, z) {
        this._position[0] += 0.1 * x;
        this._position[1] += 0.1 * y;
        this._position[2] += 0.1 * z;
    }

    rotate(p, y) {
        this._rotation[0] = p;
        this._rotation[1] = y;
    }

}

export default Entity;
