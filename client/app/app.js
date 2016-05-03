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
    // Initialize states and set as loading.
    this.stateManager = new App.Engine.StateManager(this);
    this.stateManager.setState('loading');

    // Initialize modules
    this.connectionEngine = new App.Engine.Connection(this);
    this.graphicsEngine = new App.Engine.Graphics(this);
    this.uiEngine = new App.Engine.UI(this);
    this.soundEngine = new App.Engine.Sound(this);
    this.gameEngine = new App.Engine.Game(this);

    // Run application when connection is confirmed.
    this.connect().then(function() {this.run();}.bind(this));
};

App.Core.prototype.connect = function() {
    // Return a connection promise.
    return this.connectionEngine.setup();
};

App.Core.prototype.run = function() {
    console.info('Application started locally.');

    //this.connectionEngine.send('info', 'Eye connected');
    this.connectionEngine.send('util', {request: 'createGame', gameType: 'flat3'});
    var onHubFetched = function(data) {
        this.connectionEngine.removeCustomListener('hub', onHubFetched);
        console.log(data);
    }.bind(this);
    this.connectionEngine.addCustomListener('hub', onHubFetched);

    this.connectionEngine.send('util', {request: 'hub'});

    // Run modules.
    this.uiEngine.run();
    this.graphicsEngine.run();

    // Change state.
    this.stateManager.setState('idle');
};

App.Core.prototype.updateWorld = function() {

};
