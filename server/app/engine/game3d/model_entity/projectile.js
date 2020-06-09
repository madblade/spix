/**
 * Magnus-friendly foe.
 */

'use strict';

import Entity from './entity';

class Projectile extends Entity
{
    constructor(id)
    {
        super(id);

        this._kind = 'projectile';

        this._collided = false;
    }

    set collided(c) { this._collided = c; }
    get collided() { return this._collided; }
}

export default Projectile;
