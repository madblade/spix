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
    this.stateManager = new App.Engine.StateManager();
    this.stateManager.setState('loading');

    // Initialize modules
    this.connectionEngine = new App.Engine.Connection();
    this.graphicsEngine = new App.Engine.Graphics();
    this.uiEngine = new App.Engine.UI();
    this.soundEngine = new App.Engine.Sound();
    this.gameEngine = new App.Engine.Game();

    // Run application when connection is confirmed.
    this.connect().then(function() {this.run();}.bind(this));
};

App.Core.prototype.connect = function() {
    // Return a connection promise.
    return this.connectionEngine.setup();
};

App.Core.prototype.run = function() {
    console.info('Application started locally.');

    // [temp] Request a game creation.
    this.connectionEngine.send('util', {request: 'createGame', gameType: 'flat3'});

    // Get hub state.
    var onHubFetched = function(data) {
        this.connectionEngine.removeCustomListener('hub', onHubFetched);
        this.stateManager.setState('hub', data);
        console.log(data);
    }.bind(this);
    this.connectionEngine.addCustomListener('hub', onHubFetched);

    // Run modules.
    //this.uiEngine.run();
    //this.graphicsEngine.run();

    // Change state.
    this.connectionEngine.send('util', {request: 'hub'});
};

App.Core.prototype.join = function(gameType, gid) {
    console.log('Et alors2');
    // Try to join specified game.
    this.connectionEngine.join(gameType, gid)

    .then(function() {
        // TODO start game.
        console.log("YEEEEEAAAAAAHHHH");
    }.bind(this))

    .catch(function() {
        // TODO inform user he could not join.
        // TODO manage spam-clicking...
        console.log("OOOOHHH...");
    }.bind(this));
};
