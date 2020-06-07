/**
 *
 */

'use strict';

class AI
{
    constructor(game)
    {
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        this._xModel        = game.xModel;

        this._ais = [];
        this._maxAis = 50;
        this._needingPath = [];
    }

    update()
    {
        // console.log('seeing, thinking, acting');
        this.spawnAI();
        this.aggroPass();
        this.pathFindingPass();
        this.actionPass();
    }

    spawnAI()
    {
        const nbAIs = this._ais.length;
        const maxNbAIs = this._maxAis;
        if (nbAIs < maxNbAIs)
        {
            // TODO [IA] random spawn near a player
        }
    }

    aggroPass()
    {
        // TODO [IA] see and trigger aggro
    }

    pathFindingPass()
    {
        const anEntityNeedsPathFinding = this._needingPath.length > 0;
        if (anEntityNeedsPathFinding)
        {
            // Get aggro
            // let currentEntity = this._needingPath.pop();
            // TODO [IA] path finding
        }
    }

    actionPass()
    {
        // TODO displacement or ranged target / melee action
    }
}

export default AI;
