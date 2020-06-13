/**
 * User interaction.
 */

'use strict';

import $                    from 'jquery';

import extend               from '../../extend.js';

import { KeyboardModule }   from './keyboard/keyboard.js';
import { MouseModule }      from './mouse/mouse.js';
import { TouchModule }      from './touch/touch.js';
import { WindowModule }     from './window/window.js';

let UI = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};

    // Mouse on desktop.
    this.threeControlsEnabled = false;
    this.mouse = {};

    // Keyboard needs a list of possible keystrokes;
    // and a list of keys actually pressed.
    this.keyControls = {};

    // Other input methods.
    this.touchControlsEnabled = false;
    this.isTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
    if (this.isTouch)
    {
        this.touch = {
            // Stick states
            leftX: 0, leftY: 0,
            rightX: 0, rightY: 0,
            // Euler-type controls
            rx: 0, ry: 0,
            leftLast: ''
        };
        this.touchWidgetControls = this.setupTouchWidget();
    }

    if (!this.isTouch) {
        this.settings.language = ''; // expose keyboard layout settings
    }
};

extend(UI.prototype, {

    run()
    {
        let graphicsEngine = this.app.engine.graphics;

        // XXX [ACCESSIBILITY] gamepad

        if (this.isTouch) {
            this.setupTouch();
        } else {
            this.setupKeyboard();
            this.setupMouse();
        }
        this.setupWindowListeners();

        // Should this be put somewhere else?
        $(window).resize(graphicsEngine.resize.bind(graphicsEngine));
    },

    stop()
    {
        this.stopListeners();
    },

    stopListeners()
    {
        if (this.isTouch) {
            this.stopTouchListeners();
        } else {
            this.stopKeyboardListeners();
            this.stopMouseListeners();
        }
        this.stopWindowListeners();
    },

    requestLock()
    {
        if (this.isTouch)
            this.requestTouchLock();
        else
            this.requestPointerLock();
    },
});

extend(UI.prototype, KeyboardModule);
extend(UI.prototype, MouseModule);
extend(UI.prototype, TouchModule);
extend(UI.prototype, WindowModule);

export { UI };
