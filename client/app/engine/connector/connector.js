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

    var socket = io(socketAddress, {
        // Send auth token on connection, you will need to DI the Auth service above
        // 'query': 'token=' + Auth.getToken()
        path: '/socket.io-client'
    });

    this.registerSocket(socket);

    // TODO put that somewhere else
    socket.emit('info', 'Eye connected');
    socket.emit('createGame', 'flat3');
};

App.Engine.Connection.prototype.registerSocket = function(socket) {
    // Register socket behaviour
    socket.on('moved', function(data) {
       console.log('server: moved ' + data);
    });

    socket.on('stamp', function(data) {
        this.app.updateWorld(data);
    }.bind(this));

    this.socket = socket;
};

App.Engine.Connection.prototype.connectionPromise = function() {
    return new Promise(function(resolve) { // TODO manage reject

        // Makes me think of quines.
        var f = function() {
            this.socket.removeListener('connected', f);
            resolve();
        }.bind(this);

        this.socket.on('connected', f);
    }.bind(this));
};

App.Engine.Connection.prototype.move = function(direction) {
    this.socket.emit('move', direction);
};
