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
    this.gameEngine = new App.Engine.Game(this);
    this.graphicsEngine = new App.Engine.Graphics(this);
    this.uiEngine = new App.Engine.UI(this);
    this.soundEngine = new App.Engine.Sound();

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
    }.bind(this);
    this.connectionEngine.addCustomListener('hub', onHubFetched);

    // Change state.
    this.connectionEngine.send('util', {request: 'hub'});
};

App.Core.prototype.join = function(gameType, gid) {
    console.log('Joining...');
    // Try to join specified game.
    this.connectionEngine.join(gameType, gid)
        .then(
            // Success
            function() {
                console.log("Starting game...");
                this.startGame(gameType, gid);
            }.bind(this),

            // Failure
            function() {
                // TODO manage spam-clicking...
                var err = new Error();
                console.log(err);
                console.log("Could not join game @connectionEngine.join(): server refused.");
            }.bind(this)
        );
};

App.Core.prototype.startGame = function(gameType, gameId) {
    // Configuration.
    this.stateManager.setState('ingame');
    this.connectionEngine.configureGame(gameType, gameId);

    // Start model loop.
    this.gameEngine.run(gameType);

    // Run modules.
    this.uiEngine.run();
    this.graphicsEngine.run();
    this.soundEngine.run();
};