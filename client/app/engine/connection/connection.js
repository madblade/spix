/**
 * Communication with the server.
 */

'use strict';

import extend           from '../../extend.js';
import io               from 'socket.io-client';
import { RTCService }   from './rtc';

let Connection = function(app)
{
    this.app = app;
    this.socket = {};
    this.rtc = new RTCService(app);
};

extend(Connection.prototype, {

    connectSocket(socketAddress, port, autoconfig) {
        let remoteAddress = '';

        if (!autoconfig && socketAddress === '' && location.hostname !== 'localhost') {
            remoteAddress = `ws://${location.hostname}:${port}`;
        } else if (!autoconfig) {
            remoteAddress = `ws://${socketAddress}:${port}`;
        }

        this.socket = io(remoteAddress, {
            // Send auth token on connection, you will need to DI the Auth service above
            // 'query': 'token=' + Auth.getToken()
            path: '/socket.io-client'
        });
    },

    setupLocalSocket(s)
    {
        this.socket = s;
    },

    listen()
    {
        let app = this.app;
        let hub = app.model.hub;

        // Custom listeners.
        this.socket.on('hub',               function(data) { hub.update(data); });
        this.socket.on('joined',            function() { app.joinedServer(); });
        this.socket.on('cantjoin',          function() {console.error('Server refused!');});
        this.socket.on('connected',         function() { app.connectionEstablished(); });

        // Default listeners
        this.socket.on('connect',           function() {console.log('Connecting...');});
        this.socket.on('disconnect',        function() {console.log('Disconnected!');});
        this.socket.on('reconnect',         function() {console.log('Reconnecting...');});
        this.socket.on('reconnect_failed',  function() {console.log('Could not reconnect after MANY attempts.');});
        this.socket.on('reconnect_error',   function() {console.log('Reconnection failed! :(');});
    },

    listenQuick()
    {
        let app = this.app;
        this.socket.on('hub',               function(data) {
            data = JSON.parse(data);
            let d = 'demo';
            if (!data.hasOwnProperty(d)) {
                console.log(data);
                console.error('could not join demo'); return;
            }
            let array = data[d];
            if (array.length !== 1) {
                console.log(array);
                console.log('WARN: Demo already present in the local sandbox.');
            }
            if (array.length < 1) {
                console.error('Failed to create demo.'); return;
            }
            app._forceJoin(d, array[0]);
        });
        this.socket.on('joined',            function() { app.joinedServer(); });
    },

    disconnect()
    {
        this.socket.disconnect();
        this.unregisterSocketForGame3D();

        ['hub', 'joined', 'cantjoin', 'connected', 'connect', 'disconnect',
            'reconnect', 'reconnect_failed', 'reconnect_error']
            .forEach(function(e) {this.removeCustomListener(e);}.bind(this));
    },

    addCustomListener(message, func)
    {
        this.socket.on(message, func);
    },

    removeCustomListener(message)
    {
        this.socket.removeAllListeners(message);
    },

    send(kind, message)
    {
        this.socket.emit(kind, message);
    },

    join(gameType, gid)
    {
        this.send('util', {request:'joinGame', gameType, gameId:gid});
    },

    requestHubState()
    {
        this.send('util', {request: 'hub'});
    },

    requestGameCreation(gameType, options)
    {
        this.send('util', {
            request: 'createGame', gameType, options
        });
    },

    configureGame(gameType, gid)
    {
        switch (gameType) {
            case 'cube':
            case 'flat':
            case 'demo':
            case 'fantasy':
                this.registerSocketForGame3D();
                break;
            case 'unstructured':
                console.error('[Client/Connection] Unstructured not yet supported.');
                break;
            default:
                console.error('Could not configure ' +
                    'socket listeners for an unknown game type' +
                    `on game ${gid}.`);
        }
    }
});

extend(Connection.prototype, {

    registerSocketForGame3D()
    {
        let serverModel = this.app.model.server;
        let register = this.app.register;

        this.addCustomListener('chk', serverModel.updateChunks.bind(serverModel));
        this.addCustomListener('ent', serverModel.updateEntities.bind(serverModel));
        this.addCustomListener('me', serverModel.updateMe.bind(serverModel));
        this.addCustomListener('x', serverModel.updateX.bind(serverModel));
        this.addCustomListener('chat', register.updateChat.bind(register));
    },

    unregisterSocketForGame3D()
    {
        this.removeCustomListener('chk');
        this.removeCustomListener('ent');
        this.removeCustomListener('me');
        this.removeCustomListener('x');
        this.removeCustomListener('chat');
    }

});

export { Connection };
