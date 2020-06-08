/**
 *
 */

'use strict';

import { WorldType } from '../model_world/model';

class AI
{
    constructor(game)
    {
        this._game = game;
        this._entityModel   = game.entityModel;
        this._worldModel    = game.worldModel;
        // this._xModel        = game.xModel;

        this._ais = [];
        this._maxAis = 15;
        this._needingPath = [];

        this._cycle = 1;
        this._cycleLength = 10000;
    }

    update()
    {
        const nc = (this._cycle + 1) % this._cycleLength;
        this._cycle = nc;

        // console.log('seeing, thinking, acting');
        this.spawnAI(nc);
        this.aggroPass(nc);
        this.pathFindingPass(nc);
        this.actionPass(nc);
    }

    // Random spawn an IA around a player
    spawnAI(cycle)
    {
        const nbAIs = this._ais.length;
        const maxNbAIs = this._maxAis;
        if (nbAIs < maxNbAIs)
        {
            if (cycle % 60 === 0 && Math.random() > 0.5)
            {
                let avatar = this._game.players.getRandomPlayer();
                if (!avatar)
                {
                    console.warn('[AI] An inconsistent player.');
                    return;
                }

                const p = avatar.p0;
                const wid = avatar.worldId;
                let world = this._worldModel.getWorld(wid);
                if (!world)
                {
                    console.warn('[AI] An inconsistent world.');
                    return;
                } else if (world.worldInfo.type === WorldType.CUBE)
                {
                    // IA unsupported.
                    return;
                }

                let xTest;
                let yTest;
                let zTest;
                let isFree = false;
                let attempt = 0;
                let maxAttempts = 5;
                do {
                    xTest = Math.floor(p[0] + 10 * (Math.random() - 0.5));
                    yTest = Math.floor(p[1] + 10 * (Math.random() - 0.5));
                    zTest = Math.floor(p[2] + 2);
                    ++attempt;
                    isFree = world.isFree(xTest, yTest, zTest) &&
                        world.isFree(xTest, yTest, zTest + 1);
                } while (!isFree && attempt < maxAttempts);

                if (isFree)
                {
                    let ce = this._game.consistencyEngine;
                    let newAI = ce.spawnEntity('walker',
                        world,
                        [xTest + 0.5, yTest + 0.5, zTest + 0.01]
                    );
                    newAI.aggro = avatar;
                    newAI.target = p; // Move toward avatar.
                    this._ais.push(newAI);
                } else
                {
                    console.log('Failed spawning an entity.');
                }
            }
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
        this._ais.forEach(ai =>
        {
            ai.age();
            if (ai.howLongSinceLastDecision() > 300)
            {
                // Bump entity clock
                ai.takeDecision();

                // Follow player
                let aggro = ai.aggro;
                if (aggro && aggro.p0)
                {
                    ai.target = aggro.p0;
                }

                // Random movement.
                // let oldTarget = ai.target;
                // ai.target = [
                //     oldTarget[0] + Math.floor(10 * (Math.random() - 0.5)),
                //     oldTarget[1] + Math.floor(10 * (Math.random() - 0.5)),
                //     oldTarget[2],
                // ];
            }
            let p = ai.p0;
            let d = ai.target;
            if (!d || !p)
            {
                console.log('[IA] No entity target (or position).');
                return; // to next entity
            }

            // Rotate toward player.
            const dx = d[0] - p[0];
            const dy = d[1] - p[1];
            let r = ai.rotation;
            let newPitch = Math.atan2(dy, dx) - Math.PI / 2;
            ai.rotate(newPitch, r[1], r[2], r[3]);

            // Move toward player.
            const dz = d[2] - p[2];
            ai.goForward();
            if (dz > 0.5) ai.goUp();
            else ai.stopUp();
            // if (dx < -0.5) ai.goForward();
            // else if (dx > 0.5) ai.goBackwards();
            // if (dy < -0.5) ai.goRight();
            // else if (dy > 0.5) ai.goLeft();
            // if (dz < -0.5) ai.goUp(); // Jumps?
            // else if (dz > 0.5) ai.goDown(); // Digs??
        });
        // TODO displacement or ranged target / melee action
    }
}

export default AI;
