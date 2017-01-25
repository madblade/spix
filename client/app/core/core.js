/**
 * Façade for general utility methods.
 */

'use strict';

extend(App.Core.prototype, {

    getState: function() {
        return this.state.state;
    },

    setState: function(state, opt) {
        this.state.setState(state, opt);
    },

    isLoading: function() {
        return this.getState() === 'loading';
    },

    isFocused: function() {
        return this.state.focus;
    },

    setFocused: function(isFocused) {
        this.state.focus = isFocused ? true : false;
    },

    // Called when the socket is connected.
    connectionEstablished: function() {
        console.log("Connected.");

        // TODO splash screen.
        setTimeout(
            function() {this.engine.connection.requestHubState()}.bind(this),
            1500
        );
    },

    // Called when a 'creation' request is emitted from Hub state.
    requestGameCreation: function(gameType) {
        if (this.getState() !== 'hub')
            throw 'Could not request game creation outside of Hub.';

        this.engine.connection.requestGameCreation(gameType);
        // TODO single-page without reloading every time a new game is asked...
        //location.reload();
    },

    // Called when a 'join' request is emitted from Hub state.
    join: function(gameType, gameId) {
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
    },

    // Run game when joining confirmed.
    joinedServer: function() {
        console.log('Joined server.');

        // Run game
        this.runGame();
    },

    runGame: function() {
        this.engine.graphics.run();
        this.engine.controls.run();
        this.engine.audio.run();
    },

    stopGame: function() {
        this.engine.graphics.stop();
        this.engine.controls.stop();
        this.engine.audio.stop();
    }

});
