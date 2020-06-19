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
        this._maxAis = 20;
        this._needingPath = [];

        this._cycle = 1;
        this._cycleLength = 10000;

        this._projectilesNeedingSpawn = [];
        this._projectilesNeedingDespawn = [];
    }

    update()
    {
        const nc = (this._cycle + 1) % this._cycleLength;
        this._cycle = nc;

        // console.log('seeing, thinking, acting');
        this.despawnProjectiles();
        this.spawnAI(nc);
        this.aggroPass(nc);
        this.pathFindingPass(nc);
        this.actionPass(nc);
        this.magnusPass();
        this.spawnProjectiles();
    }

    despawnProjectiles()
    {
        const despawn = this._projectilesNeedingDespawn;
        if (despawn.length > 0)
        {
            for (let i = 0; i < despawn.length; ++i)
            {
                let eid = despawn.pop();
                let ce = this._game.consistencyEngine;
                ce.despawnEntity(eid);
            }
        }
    }

    spawnProjectiles()
    {
        let pns = this._projectilesNeedingSpawn;
        const l = pns.length;
        if (l > 0)
        {
            let ce = this._game.consistencyEngine;
            for (let i = 0; i < Math.min(10, l); ++i)
            {
                let p = pns.pop();
                const wid = p[6];
                const power = Math.min(p[7] / 60, 2);
                // const wx = p[7];
                // const wy = p[8];
                // const wz = p[9];
                let world = this._worldModel.getWorld(wid);

                // let solver = this._game.physicsEngine._frontend._rigidBodies;
                // let g = solver.getGravity(world, wid, p[0], p[1], p[2]);
                let a1 = p[8]; let a2 = p[9]; let a3 = p[10];
                let norm = a1 * a1 + a2 * a2 + a3 * a3;
                if (norm === 0) continue;

                norm = Math.sqrt(norm);
                a1 /= norm; a2 /= norm; a3 /= norm;
                const b1 = p[3]; const b2 = p[4]; const b3 = p[5];
                const crossX = a2 * b3 - a3 * b2;
                const crossY = a3 * b1 - a1 * b3;
                const crossZ = a1 * b2 - a2 * b1;

                let projectile = ce.spawnEntity(
                    'projectile',
                    world,
                    [
                        p[0] - 0.1 * crossX + 0.5 * p[3],
                        p[1] - 0.1 * crossY + 0.5 * p[4],
                        p[2] - 0.1 * crossZ + 0.5 * p[5]
                    ]
                );
                projectile.a0[0] = power * 4 * p[3];
                projectile.a0[1] = power * 4 * p[4];
                projectile.a0[2] = power * 4 * p[5];
                // projectile.v0[0] = 1 * power * 0.5 * p[3];
                // projectile.v0[1] = 1 * power * 0.5 * p[4];
                // projectile.v0[2] = 1 * power * 0.5 * p[5];
            }
        }
    }

    magnusPass()
    {
        // To alter projectiles trajectory
    }

    // Random spawn an IA around a player
    spawnAI(cycle)
    {
        const nbAIs = this._ais.length;
        const maxNbAIs = this._maxAis;
        if (nbAIs < maxNbAIs)
        {
            if (cycle % 600 === 0 && Math.random() > 0.5)
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
                    const xo = Math.random() - 0.5;
                    const yo = Math.random() - 0.5;
                    xTest = Math.floor(p[0] + 10 * xo + 5 * Math.sign(xo));
                    yTest = Math.floor(p[1] + 10 * yo + 5 * Math.sign(yo));
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
                    newAI.captain = avatar;
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
        // XXX [IA] see and trigger aggro
    }

    pathFindingPass()
    {
        const anEntityNeedsPathFinding = this._needingPath.length > 0;
        if (anEntityNeedsPathFinding)
        {
            // Get aggro
            // let currentEntity = this._needingPath.pop();
            // XXX [IA] path finding
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
            // let newPitch = Math.atan2(dx, -dy);

            // Move toward player.
            const dz = d[2] - p[2];
            if (dz > 0.5)
                ai.goUp();
            else
                ai.stopUp();

            let r = ai.rotation;
            const newPitch = Math.atan2(dy, dx) - Math.PI / 2;
            ai.rotate(newPitch, r[1], r[2], r[3]);
            if (dx * dx + dy * dy > 4) ai.goForward();
            else ai.stopForward();

            // if (dx < -0.5) ai.goForward();
            // else if (dx > 0.5) ai.goBackwards();
            // if (dy < -0.5) ai.goRight();
            // else if (dy > 0.5) ai.goLeft();
            // if (dz < -0.5) ai.goUp(); // Jumps?
            // else if (dz > 0.5) ai.goDown(); // Digs??
        });
    }

    pushProjectileForSpawn(
        projectile
    )
    {
        this._projectilesNeedingSpawn.push(
            projectile
        );
    }

    pushProjectileForDespawn(
        id
    )
    {
        this._projectilesNeedingDespawn.push(
            id
        );
    }
}

export default AI;
