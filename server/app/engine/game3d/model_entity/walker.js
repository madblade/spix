/**
 * IA entry point.
 */

'use strict';

import Entity from './entity';

class Walker extends Entity
{
    constructor(id)
    {
        super(id);

        this._kind = 'ia';

        this._capW = .008;

        this._age = 0;
        this._lastDecision = 0;
        this._target = null;

        this._captain = null;
        this._aggro = null;
    }

    get aggro()             { return this._aggro; }
    set aggro(newAggro)     { this._aggro = newAggro; }

    get target()            { return this._target; }
    set target(newTarget)   { this._target = newTarget; }

    age()
    {
        ++this._age;
    }

    takeDecision()
    {
        this._lastDecision = this._age;
    }

    howLongSinceLastDecision()
    {
        return this._lastDecision - this._age;
    }
}

export default Walker;
