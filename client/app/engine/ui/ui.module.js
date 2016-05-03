/**
 * User interaction.
 */

'use strict';

App.Engine.UI = function(app) {
    this.app = app;

    this.keyMapper = null;
    this.mouseMapper = null;
    this.touchMapper = null;

    this.actions = []; // Array of game-specific actions
};

App.Engine.UI.prototype.run = function() {
    this.setupActions();
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();

    // Register keyboard behaviour
    $(window).keydown(function(event) {
        if (!event.keyCode) { return; }
        var ce = this.app.connectionEngine;

        switch (event.keyCode) {
            case 38: // Up
                ce.move('forward');
                break;
            case 39: // Right
                ce.move('right');
                break;
            case 37: // Left
                ce.move('left');
                break;
            case 40: // Down
                ce.move('down');
                break;
            default:
        }
    }.bind(this));

    $(window).resize(
        this.app.graphicsEngine.resize
            .bind(this.app.graphicsEngine)
    );
};

App.Engine.UI.prototype.setupActions = function() {};
App.Engine.UI.prototype.setupKeyboard = function() {};
App.Engine.UI.prototype.setupMouse = function() {};
App.Engine.UI.prototype.setupTouch = function() {};
