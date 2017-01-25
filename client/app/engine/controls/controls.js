/**
 * User interaction.
 */

'use strict';

App.Engine.UI = function(app) {
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

extend(App.Engine.UI.prototype, {

    run: function() {
        var graphicsEngine = this.app.engine.graphics;

        // TODO detect device (PC, tablet, smartphone, VR <- lol)
        this.setupKeyboard();
        this.setupMouse();
        this.setupTouch();

        $(window).resize(graphicsEngine.resize.bind(graphicsEngine));
    },

    stop: function() {
        this.stopListeners();
    },

    stopListeners: function() {
        this.stopKeyboardListeners();
        this.stopMouseListeners();
        this.stopTouchListeners();
    }

});
