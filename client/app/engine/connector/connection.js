/**
 * Communication with the server.
 */

'use strict';

App.Engine.Connection = function(app) {
    this.app = app;
    this.socket = {};
};

App.Engine.Connection.prototype.setup = function(autoconfig) {
    var socketAddress = '';

    if (!autoconfig && location.hostname !== 'localhost') {
        socketAddress = 'ws://' + location.hostname + ':8000';
    }

    this.socket = io(socketAddress, {
        // Send auth token on connection, you will need to DI the Auth service above
        // 'query': 'token=' + Auth.getToken()
        path: '/socket.io-client'
    });

    // Custom listeners.
    this.socket.on('hub', function(data) {console.log("Hub fetched."); this.app.setState('hub', data);}.bind(this)); // TODO refactor
    this.socket.on('joined', function() {console.log("Starting game..."); this.app.runGame();}.bind(this));
    this.socket.on('cantjoin', function() {location.reload();}.bind(this));
    this.socket.on('connected', function() {console.log("Connected."); this.send('util', {request: 'hub'})}.bind(this));

    // Default listeners
    this.socket.on('connect', function() {console.log('Connecting...')});
    this.socket.on('disconnect', function() {console.log('Disconected! :(')});
    this.socket.on('reconnect', function() {console.log('Reconnecting...')});
    this.socket.on('reconnect_failed', function() {console.log('Could not reconnect after MANY attempts.')});
    this.socket.on('reconnect_error', function() {console.log('Reconnection failed! :(')});
};

App.Engine.Connection.prototype.addCustomListener = function(message, func) {
    this.socket.on(message, func);
};

App.Engine.Connection.prototype.removeCustomListener = function(message, func) {
    this.socket.removeListener(message, func);
};

App.Engine.Connection.prototype.send = function(kind, message) {
    this.socket.emit(kind, message);
};

App.Engine.Connection.prototype.join = function(gameType, gid) {
    this.send('util', {request:'joinGame', gameType: gameType, gameId:gid});
};

App.Engine.Connection.prototype.requestGameCreation = function(gameType) {
    this.send('util', {request: 'createGame', gameType: gameType});
};

App.Engine.Connection.prototype.configureGame = function(gameType, gid) {
    switch (gameType) {
        case 'game3d':
            this.registerSocketForGame3D();
            break;
        default:
            console.log("Unknown game type...");
    }
};
