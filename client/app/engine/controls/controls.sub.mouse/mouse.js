/**
 *
 */

'use strict';

extend(App.Engine.UI.prototype, {

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
    },

    stopMouseListeners: function() {
        var graphicsEngine = this.app.engine.graphics;
        graphicsEngine.stopListeners();
        this.unregisterMouseDown();
    }

});
