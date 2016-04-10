/**
 * Custom socket communication layer.
 */

'use strict';

class Connector {

    constructor(app) {
        this._app = app;
        this._clients = [];
    }

    addClient(client) {
        var clients = this._clients;
        var app = this._app;
        clients.push(client);
        if (clients.length === 1) {
            app.start();
        }
    }

    removeClient(client) {
        var clients = this._clients;
        var app = this._app;
        clients.splice(clients.indexOf(client), 1);
        if (clients.length < 1) {
            app.stop();
        }
    }

    // When the user disconnects, perform this
    onDisconnect(socket) {
        this.removeClient(socket);
    }

    // When the user connects, perform this
    onConnect(socket) {
        this.addClient(socket);

        // When the client emits 'info', this listens and executes
        socket.on('info', data => {
            socket.log(JSON.stringify(data, null, 2));
        });

        // Call onDisconnect.
        socket.on('disconnect', () => {
            this.onDisconnect(socket);
            socket.log('DISCONNECTED');
        });

        // Insert sockets below
        socket.on('move', (data) => {
            socket.emit('moved', 'got ' + data);
        });
    }

    configure(socketio) {
        // socket.io (v1.x.x) is powered by debug.
        // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
        // (don't forget to import config from './environment' ;)
        //
        // ex: DEBUG: "http*,socket.io:socket"

        // We can authenticate socket.io users and access their token through socket.decoded_token
        //
        // 1. You will need to send the token in `client/components/socket/socket.service.js`
        //
        // 2. Require authentication here:
        // socketio.use(require('socketio-jwt').authorize({
        //   secret: config.secrets.session,
        //   handshake: true
        // }));

        socketio.on('connection', socket => {
            socket.address = socket.request.connection.remoteAddress +
                ':' + socket.request.connection.remotePort;

            socket.connectedAt = new Date();

            socket.log = function(...data) {
                console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
            };

            // Call onConnect.
            this.onConnect(socket);
            socket.log('CONNECTED');
        });
    }

}

export default Connector;