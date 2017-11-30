/**
 * Communication with the server.
 */

'use strict';

import extend           from '../../extend.js';
import io               from 'socket.io-client';

let Connection = function(app) {
    this.app = app;
    this.socket = {};
};

extend(Connection.prototype, {

    connect(autoconfig) {
        let socketAddress = '';
        let app = this.app;
        let hub = app.model.hub;

        if (!autoconfig && location.hostname !== 'localhost') {
            socketAddress = `ws://${location.hostname}:8000`;
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
        this.socket.on('connect',           function() {console.log('Connecting...');});
        this.socket.on('disconnect',        function() {console.log('Disconected! :(');});
        this.socket.on('reconnect',         function() {console.log('Reconnecting...');});
        this.socket.on('reconnect_failed',  function() {console.log('Could not reconnect after MANY attempts.');});
        this.socket.on('reconnect_error',   function() {console.log('Reconnection failed! :(');});
    },

    disconnect() {
        let scope = this;
        scope.unregisterSocketForGame3D();

        ['hub', 'joined', 'cantjoin', 'connected', 'connect', 'disconnect',
            'reconnect', 'reconnect_failed', 'reconnect_error']
            .forEach(function(e) {this.removeCustomListener(e);}.bind(this));
    },

    addCustomListener(message, func) {
        this.socket.on(message, func);
    },

    removeCustomListener(message) {
        this.socket.removeAllListeners(message);
    },

    send(kind, message) {
        this.socket.emit(kind, message);
    },

    join(gameType, gid) {
        this.send('util', {request:'joinGame', gameType, gameId:gid});
    },

    requestHubState() {
        this.send('util', {request: 'hub'});
    },

    requestGameCreation(gameType) {
        this.send('util', {request: 'createGame', gameType});
    },

    configureGame(gameType, gid) {
        switch (gameType) {
            case 'game3d':
                this.registerSocketForGame3D();
                break;
            default:
                throw Error('Could not configure ' +
                    'socket listeners for an unknown game type' +
                    `on game ${gid}.`);
        }
    }
});

extend(Connection.prototype, {

    registerSocketForGame3D() {
        let serverModel = this.app.model.server;
        let register = this.app.register;

        this.addCustomListener('chk', serverModel.updateChunks.bind(serverModel));
        this.addCustomListener('ent', serverModel.updateEntities.bind(serverModel));
        this.addCustomListener('me', serverModel.updateMe.bind(serverModel));
        this.addCustomListener('x', serverModel.updateX.bind(serverModel));
        this.addCustomListener('chat', register.updateChat.bind(register));
    },

    unregisterSocketForGame3D() {
        this.removeCustomListener('chk');
        this.removeCustomListener('ent');
        this.removeCustomListener('me');
        this.removeCustomListener('x');
        this.removeCustomListener('chat');
    }

});

export { Connection };