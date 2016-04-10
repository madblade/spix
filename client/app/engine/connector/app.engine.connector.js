/**
 * Communication with the server.
 */

'use strict';

App.Engine.Connection = function(app) {
    this.app = app;
    this.socket = {};
};

App.Engine.Connection.prototype.init = function(autoconfig) {
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

    socket.emit('info', 'Eye connected');
};

App.Engine.Connection.prototype.registerSocket = function(socket) {
    // Register socket behaviour
    socket.on('moved', function(data) {
       console.log('server: moved ' + data);
    });

    this.socket = socket;
};


App.Engine.Connection.prototype.move = function(direction) {
    this.socket.emit('move', direction);
};