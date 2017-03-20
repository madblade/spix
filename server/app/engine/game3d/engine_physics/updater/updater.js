/**
 *
 */

'use strict';

class Updater {

    constructor(physicsEngine) {
        
        //
        this._physicsEngine = physicsEngine;
    
    }

    update(inputBuffer) {

        // Process incoming actions.
        inputBuffer.forEach( (array, avatar) => // value, key
        {
            // TODO [LOW] compute means or filter some events.
            array.forEach(e => {
                if (e.action === 'move' && typeof e.meta === "string")
                    Updater.move(e.meta, avatar);

                else if (e.action === 'rotate' && e.meta instanceof Array)
                    this.rotate(e.meta, avatar);

                else if (e.action === 'action' && typeof e.meta === "string")
                    this.action(e.meta, avatar);
            });
        });
        
    }

    // Constrained => forward border effect to physics solver.
    static move(meta, avatar) {
        var hasMoved = true;
        switch (meta) {
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

            default: hasMoved = false;
        }
    };

    // Unconstrained => direct update, then notify output.
    rotate(meta, avatar) {
        if (avatar.rotation === null) return;

        let outputBuffer = this._physicsEngine.outputBuffer;

        let p = meta[0], y = meta[1];

        if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
            avatar.rotate(p, y);
            outputBuffer.entityUpdated(avatar.entityId);
        }
    }

    // Unconstrained actions API.
    action(meta, avatar) {
        if (meta === "g") {
            this._physicsEngine.shuffleGravity();
        }
    }

}

export default Updater;
