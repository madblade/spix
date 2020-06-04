/**
 *
 */

'use strict';

import Entity from './entity';

class Cube extends Entity
{
    constructor(id)
    {
        super(id);

        this._kind = 'cube';
    }
}

export default Cube;
