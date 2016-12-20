/**
 *
 */

'use strict';

class Updater {

    constructor(physicsEngine) {
        // Engine.
        this._physicsEngine = physicsEngine;

        // Models.
        this._entityModel = physicsEngine.entityModel;

        // Output. (rotation causes entities to update)
        this._outputBuffer = physicsEngine.outputBuffer;
    }

    update(inputBuffer) {

        // Process incoming actions.
        inputBuffer.forEach( (array, avatar) => // value, key
        {
            // TODO compute means or filter some events.
            array.forEach(e => {
                if (e.action === 'move' && typeof e.meta === "string")
                    this.move(e.meta, avatar);

                else if (e.action === 'rotate' && e.meta instanceof Array)
                    this.rotate(e.meta, avatar);

                else if (e.action === 'action' && typeof e.meta === "string")
                    this.action(e.meta, avatar);
            });
        });
    }

    move(meta, avatar) {
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

    rotate(meta, avatar) {
        if (avatar.rotation === null) return;

        let entityModel = this._entityModel;
        let outputBuffer = this._outputBuffer;

        let p = meta[0];
        let y = meta[1];

        if (p !== avatar.rotation[0] || y !== avatar.rotation[1]) {
            avatar.rotate(p, y);
            outputBuffer.entityUpdated(avatar.id);
        }
    }

    action(meta, avatar) {
        if (meta === "g") {
            this._physicsEngine.shuffleGravity();
        }
    }

}

export default Updater;
