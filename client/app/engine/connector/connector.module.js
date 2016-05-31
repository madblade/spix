/**
 * Communication with the server.
 */

'use strict';

App.Engine.Connection = function(app) {
    this.app = app;
    this.socket = {};
};

App.Engine.Connection.prototype.setup = function(autoconfig) {
    // Create socket.
    var promise = this.registerSocketDefault(autoconfig);

    // Define custom listeners on this socket.
    this.registerSocketCustom(this.socket);

    // This promise waits for the server to confirm connection.
    return promise;
};

App.Engine.Connection.prototype.registerSocketDefault = function(autoconfig) {
    var socketAddress = '';

    if (!autoconfig && location.hostname !== 'localhost') {
        socketAddress = 'ws://' + location.hostname + ':8000';
    }

    this.socket = io(socketAddress, {
        // Send auth token on connection, you will need to DI the Auth service above
        // 'query': 'token=' + Auth.getToken()
        path: '/socket.io-client'
    });

    return new Promise(function(resolve) {
        // Validate when 'connected' message is received.
        var f = function() {
            // Un-register listener to avoid performance leak.
            this.socket.removeListener('connected', f);
            resolve();
        }.bind(this);

        // Listen for connection.
        this.socket.on('connected', f);
    }.bind(this));
};

App.Engine.Connection.prototype.addCustomListener = function(message, func) {
    this.socket.on(message, func);
};

App.Engine.Connection.prototype.removeCustomListener = function(message, func) {
    this.socket.removeListener(message, func);
};

// Do not register all sockets here anymore
App.Engine.Connection.prototype.registerSocketCustom = function(socket) {
};

// TODO optimize client interaction to avoid overwhelming the server.
App.Engine.Connection.prototype.send = function(message, content) {
    this.socket.emit(message, content);
};

App.Engine.Connection.prototype.join = function(gameType, gid) {
    return new Promise(function(resolve, reject) {
        // Validate when 'joined' message is received.
        var f = function() {
            this.socket.removeListener('joined', f);
            this.socket.removeListener('cantjoin', g);
            resolve();
        }.bind(this);

        // Reject
        var g = function() {
            this.socket.removeListener('joined', f);
            this.socket.removeListener('cantjoin', g);
            reject();
        }.bind(this);

        // Listen for connection.
        this.socket.on('joined', f);
        this.socket.on('cantjoin', g);
        this.send('util', {request:'joinGame', gameType: gameType, gameId:gid});
    }.bind(this));
};

App.Engine.Connection.prototype.configureGame = function(gameType, gid) {
    switch (gameType) {
        case 'flat3':
            this.registerSocketForFlat3();
            break;
        default:
    }
};
