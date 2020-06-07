/**
 *
 */

'use strict';

class AIInput
{
    constructor(game)
    {
        this._game = game;

        this._entityModel = game.entityModel;
        this._worldModel = game.worldModel;
    }

    update()
    {
        // console.log('pushing desires to physics');
    }
}

export default AIInput;
