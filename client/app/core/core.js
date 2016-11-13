/**
 *
 */

'use strict';

App.Core.prototype.join = function(gameType, gameId) {
    console.log('Joining...');

    // Configuration.
    this.state.setState('ingame');
    this.engine.connection.configureGame(gameType, gameId);

    // Start model loop.
    this.model.server.run(gameType);

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
    this.engine.connection.send('util', {request: 'createGame', gameType: gameType});
    location.reload();
};
