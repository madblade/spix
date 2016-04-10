/**
 * Application entry point.
 */

'use strict';

var App = App || {
    'Core': {},
    'Engine': {},
    'Modules': {}
};

App.Core = function() {
    // Init modules
    this.connectionEngine = new App.Engine.Connection(this);
    this.graphicsEngine = new App.Engine.Graphics(this);
    this.uiEngine = new App.Engine.UI(this);
    this.soundEngine = new App.Engine.Sound(this);

    // Run application
    this.run();
};

App.Core.prototype.run = function() {
    console.info("Application started locally.");

    // Run modules
    this.connectionEngine.init();
};