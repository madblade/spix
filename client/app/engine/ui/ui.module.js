/**
 * User interaction.
 */

'use strict';

App.Engine.UI = function(app) {
    this.app = app;
};

App.Engine.UI.prototype.run = function() {

    // Register keyboard behaviour
    $(window).keydown(function(event) {
        if (!event.keyCode) { return; }

        switch (event.keyCode) {
            case 38: // Up
                this.app.connectionEngine.move('forward');
                break;
            case 39: // Right
                this.app.connectionEngine.move('right');
                break;
            case 37: // Left
                this.app.connectionEngine.move('left');
                break;
            case 40: // Down
                this.app.connectionEngine.move('down');
                break;
            default:
        }
    }.bind(this));

    $(window).resize(
        this.app.graphicsEngine.resize
            .bind(this.app.graphicsEngine)
    );
};
