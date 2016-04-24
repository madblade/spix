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

    // Run application.
    this.connect().then(function() {this.run()}.bind(this));

    this.connectionEngine.send('info', 'Eye connected');
    this.connectionEngine.send('createGame', 'flat3');
};

App.Core.prototype.connect = function() {
    // Return a connection promise.
    return this.connectionEngine.setup();
};

App.Core.prototype.run = function() {
    console.info('Application started locally.');

    // Run modules.
};

App.Core.prototype.updateWorld = function() {

};
