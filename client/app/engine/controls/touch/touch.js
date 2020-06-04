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

        let widgetControls = new MobileWidgetControls(
            widget,
            this.onLeftStickMove.bind(this),
            this.onRightStickMove.bind(this),
            this.onButtonChange.bind(this),
            'playstation'
        );
        widgetControls.element.style.visibility = 'hidden';
        return widgetControls;
    },

    // Setup listener
    setupTouch()
    {},

    // Activate listeners
    startTouchListeners()
    {
        if (!this.isTouch)
        {
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
    },

    stopTouchListeners()
    {
        let widget = this.touchWidgetControls;
        widget.stopWidgetListeners();
        widget.element.style.visibility = 'hidden';
    },

    requestTouchLock()
    {
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

    updateControlsDevice()
    {
        if (!this.isTouch) return;
        if (!this.touchControlsEnabled) return;

        // Update widget model and visual.
        this.touchWidgetControls.animate();

        // Right stick: camera movement
        this.rotateCameraFromRightStick();

        // Left stick: player movement
        this.movePlayerFromLeftStick();
    },
};

extend(TouchModule, ListenerModule);

export { TouchModule };
