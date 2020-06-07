/**
 *
 */

'use strict';

class AIOutput
{
    constructor(game)
    {
        this._game = game;

        this._entityModel = game.entityModel;
        this._worldModel = game.worldModel;
    }

    update()
    {
        // console.log('giving the world to AI');
    }
}

export default AIOutput;
