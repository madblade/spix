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

let UI = function(app) {
    this.app = app;

    // User customizable settings.
    this.settings = {
        language: ''
    };

    this.threeControlsEnabled = false;

    // Keyboard needs a list of possible keystrokes;
    // and a list of keys actually pressed.
    this.keyControls = {};

    // Other input methods.
    this.mouse = {};
    this.touch = {};
};

extend(UI.prototype, {

    run() {
        let graphicsEngine = this.app.engine.graphics;

        // TODO detect device (PC, tablet, smartphone, VR <- lol)
        this.setupKeyboard();
        this.setupMouse();
        this.setupTouch();
        this.setupWindowListeners();

        $(window).resize(graphicsEngine.resize.bind(graphicsEngine));
    },

    stop() {
        this.stopListeners();
    },

    stopListeners() {
        this.stopKeyboardListeners();
        this.stopMouseListeners();
        this.stopTouchListeners();
        this.stopWindowListeners();
    }

});

extend(UI.prototype, KeyboardModule);
extend(UI.prototype, MouseModule);
extend(UI.prototype, TouchModule);
extend(UI.prototype, WindowModule);

export { UI };
