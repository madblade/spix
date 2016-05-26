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

    move(x, y, z) {
        var theta = this._rotation[0];
        var sx, sy;
        var tx, ty;
        var cas = 0;

        if (y===1) {sx = -1; sy = 1;}
        else if (y===-1) {sx = 1; sy = -1}
        else if (x===1) {sx = 1; sy = 1; cas=1;}
        else if (x===-1) {sx = -1; sy = -1; cas=1;}

        if (cas===0) {
            tx = sx*Math.sin(theta);
            ty = sy*Math.cos(theta);
        } else if (cas===1) {
            tx = sx*Math.cos(theta);
            ty = sy*Math.sin(theta);
        }

        this._position[0] += tx;
        this._position[1] += ty;
        this._position[2] += z;
    }

    rotate(p, y) {
        this._rotation[0] = p;
        this._rotation[1] = y;
    }

}

export default Entity;
