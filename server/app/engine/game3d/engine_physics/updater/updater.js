/**
 *
 */

'use strict';

class Updater
{
    constructor(physicsEngine)
    {
        //
        this._physicsEngine = physicsEngine;
    }

    update(inputBuffer)
    {
        // Process incoming actions.
        inputBuffer.forEach((array, avatar) => // value, key
        {
            // TODO [PERF] compute means or filter some events.
            array.forEach(e => {
                if (e.action === 'move' && typeof e.meta === 'string')
                    Updater.move(e.meta, avatar);

                else if (e.action === 'rotate' && e.meta instanceof Array)
                    this.rotate(e.meta, avatar);

                else if (e.action === 'action' && typeof e.meta === 'string')
                    this.action(e.meta, avatar);

                else if (e.action === 'use' && e.meta instanceof Array)
                    this.use(e.meta, avatar);
            });
        });
    }

    // Constrained => forward border effect to physics solver.
    static move(meta, avatar)
    {
        // let hasMoved = true;
        switch (meta)
        {
            case 'f'  : avatar.goForward();     break;
            case 'r'  : avatar.goRight();       break;
            case 'l'  : avatar.goLeft();        break;
            case 'b'  : avatar.goBackwards();   break;
            case 'u'  : avatar.goUp();          break;
            case 'd'  : avatar.goDown();        break;

            case 'fx' : avatar.stopForward();   break;
            case 'rx' : avatar.stopRight();     break;
            case 'lx' : avatar.stopLeft();      break;
            case 'bx' : avatar.stopBackwards(); break;
            case 'ux' : avatar.stopUp();        break;
            case 'dx' : avatar.stopDown();      break;
            case 'xx' : avatar.stop();          break;

            case 'run' : avatar.startRunning(); break;
            case 'runx' : avatar.stopRunning(); break;

            default:
                // hasMoved = false;
        }
    }

    // Unconstrained => direct update, then notify output.
    rotate(meta, avatar)
    {
        let rotation = avatar.rotation;
        if (rotation === null) return;

        let outputBuffer = this._physicsEngine.outputBuffer;

        let relPitch = meta[0]; // Represents self rotation.
        let relYaw = meta[1];
        let absPitch = meta[2]; // Represents gravity.
        let absYaw = meta[3];

        if (relPitch !== rotation[0] || relYaw !== rotation[1] ||
            absPitch !== rotation[2] || absYaw !== rotation[3])
        {
            avatar.rotate(relPitch, relYaw, absPitch, absYaw);
            outputBuffer.entityUpdated(avatar.entityId);
        }
    }

    // Unconstrained actions API.
    action(meta/*, avatar*/)
    {
        if (meta === 'g')
        {
            this._physicsEngine.shuffleGravity();
        }
    }

    use(meta, avatar)
    {
        // TODO [GAMEPLAY] validate item in inventory
        // TODO [GAMEPLAY] give inventory state to players
        // console.warn('[Physics/Updater] Player wants to use item. To implement.');
        // console.log(meta);
        if (meta.length !== 10)
        {
            console.warn(`[Physics/Updater] A player wants to use an item, 
                but the server does not understand which one or how.`
            );
            return;
        }
        // console.log(avatar.entityId);

        const px = parseFloat(meta[0]);
        const py = parseFloat(meta[1]);
        const pz = parseFloat(meta[2]);
        const fx = parseFloat(meta[3]);
        const fy = parseFloat(meta[4]);
        const fz = parseFloat(meta[5]);
        const isButtonDown = !(meta[6]);
        const isPrimaryButton = !(meta[7]);
        const itemType = meta[8]; // 'melee' or 'ranged'
        // const itemID = meta[9];

        switch (itemType)
        {
            case 'melee':
                if (!isButtonDown)
                {
                    avatar.unParry();
                    avatar.unLoadRanged();
                    break;
                }
                if (isPrimaryButton &&
                    !avatar.hasJustMeleed &&
                    !avatar.hasJustFired) // Prevent spam
                {
                    avatar.unParry();
                    avatar.unLoadRanged();
                    avatar.melee(
                        px, py, pz,
                        fx, fy, fz
                    );
                }
                if (!isPrimaryButton)
                {
                    avatar.unLoadRanged();
                    avatar.parry();
                }
                break;
            case 'ranged':
                if (!isPrimaryButton) break;
                if (isButtonDown)
                {
                    avatar.unParry();
                    avatar.loadRanged();
                }
                else if (avatar.loadingRanged)
                {
                    avatar.unParry();
                    avatar.unLoadRanged();
                    avatar.fire(
                        px, py, pz,
                        fx, fy, fz
                    );
                }
                break;
            default:
                console.warn('[Physics/Updater] Invalid item type.');
                break;
        }
    }
}

export default Updater;
