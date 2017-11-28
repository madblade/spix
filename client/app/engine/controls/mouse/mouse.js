/**
 *
 */

'use strict';

import extend from '../../../extend.js';

import { FirstPersonModule } from './first-person.js';
import { ListenerModule } from './listeners.js';
import { PointerLockModule } from './pointerlockcontrols.js';

var MouseModule = {

    setupMouse: function() {
        this.buttons = {left: 1, middle: 2, right: 3};

        // Click / move handlers.
        this.setupPointerLock();
    },

    getControls: function(controlType) {
        var controls;

        if (controlType === 'first-person') {
            controls = this.getFirstPersonControls();
            controls.type = 'fp';
        } else {
            controls = undefined;
        }

        return controls;
    },

    startMouseListeners: function() {
        var graphicsEngine = this.app.engine.graphics;
        graphicsEngine.startListeners();
        this.registerMouseDown();
        this.registerMouseWheel();
    },

    stopMouseListeners: function() {
        var graphicsEngine = this.app.engine.graphics;
        graphicsEngine.stopListeners();
        this.unregisterMouseDown();
        this.unregisterMouseWheel();
    }

};

// Pack module.
extend(MouseModule, ListenerModule);
extend(MouseModule, FirstPersonModule);
extend(MouseModule, PointerLockModule);

export { MouseModule };
