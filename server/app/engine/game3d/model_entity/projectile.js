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
    }
}

export default Projectile;
