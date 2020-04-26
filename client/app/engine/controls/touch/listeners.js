/**
 *
 */

'use strict';

let ListenerModule = {

    onLeftStickMove(x, y) {
        this.touch.leftX = x;
        this.touch.leftY = y;
    },

    onRightStickMove(x, y) {
        this.touch.rightX = x;
        this.touch.rightY = y;
    },

    onButtonChange(which, isHeld) {
        if (which === 'triangle') {
            this.touchLockChanged(false);
        }
        console.log(`Button ${which} ${isHeld ? 'pressed' : 'released'}.`);
    },

    rotateCameraFromRightStick() {
        let graphics = this.app.engine.graphics;
        let movementX = this.touch.rightX * 8;
        let movementY = this.touch.rightY * 6;
        if (Math.abs(movementX) > 0 || Math.abs(movementY) > 0)
            graphics.cameraManager.addCameraRotationEvent(movementX, movementY, 0, 0);
    },

    movePlayerFromLeftStick()
    {
        let clientModel = this.app.model.client;
        let lx = this.touch.leftX;
        let ly = this.touch.leftY;
        let lastLeft = this.touch.leftLast;
        let newLeft = [];
        if (ly !== 0 && lx !== 0) {
            let angle = Math.atan2(ly, lx);
            let pi8 = Math.PI / 8;
            switch (true) {
                case angle < -7 * pi8 || angle > 7 * pi8:
                    newLeft.push('l');
                    break;
                case angle < -5 * pi8:
                    newLeft.push('f', 'l');
                    break;
                case angle < -3 * pi8:
                    newLeft.push('f');
                    break;
                case angle < -pi8:
                    newLeft.push('f', 'r');
                    break;
                case angle > 5 * pi8:
                    newLeft.push('b');
                    break;
                case angle > 3 * pi8:
                    newLeft.push('b', 'l');
                    break;
                case angle > pi8:
                    newLeft.push('b', 'r');
                    break;
                default:
                    newLeft.push('r');
                    break;
            }
        }

        if (newLeft.length > 2) console.error('[Touch] too many events detected.');
        for (let i = 0; i < newLeft.length; ++i) {
            let t = newLeft[i];
            if (lastLeft.indexOf(t) < 0) clientModel.triggerEvent('m', `${t}`);
        }
        for (let i = 0; i < lastLeft.length; ++i) {
            let t = lastLeft[i];
            if (newLeft.indexOf(t) < 0) clientModel.triggerEvent('m', `${t}x`);
        }
        this.touch.leftLast = newLeft;
    }

};

export { ListenerModule };
