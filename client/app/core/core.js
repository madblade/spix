/**
 * Façade for general utility methods.
 */

'use strict';

App.Core.prototype.getState = function() {
    return this.state.state;
};

App.Core.prototype.setState = function(state, opt) {
    this.state.setState(state, opt);
};

App.Core.prototype.isLoading = function() {
    return this.getState() === 'loading';
};

// Called when the socket is connected.
App.Core.prototype.connectionEstablished = function() {
    console.log("Connected.");

    // TODO splash screen.
    setTimeout(
        function() {this.engine.connection.requestHubState()}.bind(this),
        1500
    );
};

// Called when a 'creation' request is emitted from Hub state.
App.Core.prototype.requestGameCreation = function(gameType) {
    if (this.getState() !== 'hub')
        throw 'Could not request game creation outside of Hub.';

    this.engine.connection.requestGameCreation(gameType);
    // TODO single-page without reloading every time a new game is asked...
    //location.reload();
};

// Called when a 'join' request is emitted from Hub state.
App.Core.prototype.join = function(gameType, gameId) {
    if (this.getState() !== 'hub')
        throw 'Could not request game joining outside of Hub.';

    console.log('Join request...');

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

// Run game when joining confirmed.
App.Core.prototype.joinedServer = function() {
    console.log('Joined server.');

    // Run game
    this.runGame();
};

App.Core.prototype.runGame = function() {
    this.engine.graphics.run();
    this.engine.controls.run();
    this.engine.audio.run();
};

App.Core.prototype.stopGame = function() {
    this.engine.graphics.stop();
    this.engine.controls.stop();
    this.engine.audio.stop();
};
