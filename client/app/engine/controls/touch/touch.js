/**
 *
 */

'use strict';

import extend from '../../../extend.js';

import { ListenerModule } from './listeners.js';
import { MobileWidgetControls } from './MobileWidgetControls';

let TouchModule = {

    setupTouchWidget()
    {
        let widget = document.getElementById('widget');

        let onLeftStickMove = (x, y) => {
            this.touch.leftX = x;
            this.touch.leftY = y;
        };
        let onRightStickMove = (x, y) => {
            this.touch.rightX = x;
            this.touch.rightY = y;
        };
        let onButtonChange = (which, isHeld) => {
            if (which === 'triangle') {
                this.touchLockChanged(false);
            }
            console.log(`Button ${which} ${isHeld ? 'pressed' : 'released'}.`);
        };
        let widgetControls = new MobileWidgetControls(
            widget, onLeftStickMove, onRightStickMove, onButtonChange,
            'playstation'
        );
        widgetControls.element.style.visibility = 'hidden';
        return widgetControls;
    },

    // Setup listener
    setupTouch()
    {
        // TODO make visible
        // var startX,
        //     startY,
        //     dX, dY, daX, daY,
        //     threshold = 150, // Required min distance traveled to be considered swipe.
        //     allowedTime = 250, // Maximum time allowed to travel that distance.
        //     elapsedTime,
        //     startTime;

        // this.startTouchListeners();
    },

    // Activate listeners
    startTouchListeners() {
        if (!this.isTouch) {
            console.error('[Touch] Trying to initialize touch on non-touch device.');
            return;
        }

        // Reset sticks
        let touch = this.touch;
        touch.leftX = touch.leftY = 0;
        touch.rightX = touch.rightY = 0;
        touch.rx = touch.ry = 0;
        touch.leftLast = [];

        let widget = this.touchWidgetControls;
        widget.init();
        widget.element.style.visibility = 'visible';
        widget.startWidgetListeners();
        // this.registerTouch();
    },

    stopTouchListeners() {
        let widget = this.touchWidgetControls;
        widget.stopWidgetListeners();
        widget.element.style.visibility = 'hidden';
        // this.unregisterTouch();
    },

    requestTouchLock() {
        this.touchControlsEnabled = true;
        let controlsEngine = this.app.engine.controls;
        controlsEngine.startTouchListeners();
        controlsEngine.startWindowListeners();
    },

    touchLockChanged(isTouchLocked)
    {
        // Exits from lock status.
        let app = this.app;
        app.engine.controls.touchControlsEnabled = isTouchLocked;

        if (!isTouchLocked) {
            app.setState('settings');
            app.setFocused(false);
        }
    },

    updateControlsDevice() {
        if (!this.isTouch) return;
        if (!this.touchControlsEnabled) return;
        let graphics = this.app.engine.graphics;

        // Update widget model and visual.
        this.touchWidgetControls.animate();

        // Right stick: camera movement
        let movementX = this.touch.rightX * 8;
        let movementY = this.touch.rightY * 6;
        if (Math.abs(movementX) > 0 || Math.abs(movementY) > 0)
            graphics.cameraManager.addCameraRotationEvent(movementX, movementY, 0, 0);

        // Left stick: player movement
        let clientModel = this.app.model.client;
        let lx = this.touch.leftX;
        let ly = this.touch.leftY;
        let lastLeft = this.touch.leftLast;
        let newLeft = [];
        if (lx > 0) newLeft.push('r');
        if (lx < 0) newLeft.push('l');
        if (ly < 0) newLeft.push('f');
        if (ly > 0) newLeft.push('b');
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
    },
};

extend(TouchModule, ListenerModule);

export { TouchModule };
