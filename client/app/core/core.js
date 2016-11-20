/**
 * Façade for general utility methods.
 */

'use strict';

App.Core.prototype.join = function(gameType, gameId) {
    console.log('Joining...');

    // Configuration.
    this.setState('ingame');
    this.engine.connection.configureGame(gameType, gameId);

    // Start model loop.
    this.model.client.init(gameType);
    this.model.server.init(gameType);
    console.log('Game effectively started.');

    // Try to join specified game.
    this.engine.connection.join(gameType, gameId);
};

// Run game modules.
App.Core.prototype.runGame = function() {
    this.engine.graphics.run();
    this.engine.controls.run();
    this.engine.audio.run();
};

App.Core.prototype.requestGameCreation = function(gameType) {
    this.engine.connection.requestGameCreation(gameType);
    // TODO single-page without reloading every time a new game is asked...
    location.reload();
};

App.Core.prototype.getState = function() {
    return this.state.state;
};

App.Core.prototype.setState = function(state, opt) {
    this.state.setState(state, opt);
};
