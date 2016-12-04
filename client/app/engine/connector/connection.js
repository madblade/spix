/**
 * Communication with the server.
 */

'use strict';

App.Engine.Connection = function(app) {
    this.app = app;
    this.socket = {};
};

App.Engine.Connection.prototype.connect = function(autoconfig) {
    var socketAddress = '';
    var app = this.app;
    var hub = app.model.hub;

    if (!autoconfig && location.hostname !== 'localhost') {
        socketAddress = 'ws://' + location.hostname + ':8000';
    }

    this.socket = io(socketAddress, {
        // Send auth token on connection, you will need to DI the Auth service above
        // 'query': 'token=' + Auth.getToken()
        path: '/socket.io-client'
    });

    // Custom listeners.
    this.socket.on('hub',               function(data) {hub.update(data);});
    this.socket.on('joined',            function() {app.joinedServer();});
    this.socket.on('cantjoin',          function() {location.reload();});
    this.socket.on('connected',         function() {app.connectionEstablished();});

    // Default listeners
    this.socket.on('connect',           function() {console.log('Connecting...')});
    this.socket.on('disconnect',        function() {console.log('Disconected! :(')});
    this.socket.on('reconnect',         function() {console.log('Reconnecting...')});
    this.socket.on('reconnect_failed',  function() {console.log('Could not reconnect after MANY attempts.')});
    this.socket.on('reconnect_error',   function() {console.log('Reconnection failed! :(')});
};

App.Engine.Connection.prototype.disconnect = function() {
    var scope = this;
    scope.unregisterSocketForGame3D();

    ['hub', 'joined', 'cantjoin', 'connected', 'connect', 'disconnect',
     'reconnect', 'reconnect_failed', 'reconnect_error']
     .forEach(function(e) {this.removeCustomListener(e)}.bind(this));
};

App.Engine.Connection.prototype.addCustomListener = function(message, func) {
    this.socket.on(message, func);
};

App.Engine.Connection.prototype.removeCustomListener = function(message) {
    this.socket.removeAllListeners(message);
};

App.Engine.Connection.prototype.send = function(kind, message) {
    this.socket.emit(kind, message);
};

App.Engine.Connection.prototype.join = function(gameType, gid) {
    this.send('util', {request:'joinGame', gameType: gameType, gameId:gid});
};

App.Engine.Connection.prototype.requestHubState = function() {
    this.send('util', {request: 'hub'});
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
            throw 'Could not configure socket listeners for an unknown game type.';
    }
};
