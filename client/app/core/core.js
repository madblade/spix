/**
 *
 */

'use strict';

App.Core.prototype.connect = function() {
    // Return a connection promise.
    return this.engine.connection.setup();
};

App.Core.prototype.run = function() {
    console.info('Application started locally.');

    // Get hub state.
    var onHubFetched = function(data) {
        this.engine.connection.removeCustomListener('hub', onHubFetched);
        this.state.setState('hub', data);
    }.bind(this);
    this.engine.connection.addCustomListener('hub', onHubFetched);

    // Change state.
    this.engine.connection.send('util', {request: 'hub'});
};

App.Core.prototype.join = function(gameType, gid) {
    console.log('Joining...');

    // Start core engine to listen for first packet.
    this.startGame(gameType, gid);

    // Try to join specified game.
    this.engine.connection.join(gameType, gid)
        .then(
        // Success
        function() {
            console.log("Starting game...");
            this.runGame(); // Run all modules.
        }.bind(this),

        // Failure
        function() {
            // force F5
            location.reload();
        }.bind(this)
    );
};

App.Core.prototype.startGame = function(gameType, gameId) {
    // Configuration.
    this.state.setState('ingame');
    this.engine.connection.configureGame(gameType, gameId);

    // Start model loop.
    this.model.server.run(gameType);
    this.engine.graphics.run();
};

// Run game modules.
App.Core.prototype.runGame = function() {
    this.engine.controls.run();
    this.engine.audio.run();
};
