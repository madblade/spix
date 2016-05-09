/**
 * User interaction.
 */

'use strict';

App.Engine.UI = function(app) {
    this.app = app;

    // Keyboard needs a list of possible keystrokes;
    this.keys = {};
    // and a list of keys actually pressed.
    this.activeKeys = {};

    // Other input methods.
    this.mouse = {};
    this.touch = {};
};

App.Engine.UI.prototype.run = function() {
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();

    $(window).resize(
        this.app.graphicsEngine.resize
            .bind(this.app.graphicsEngine)
    );
};
