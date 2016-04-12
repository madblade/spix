/**
 * Custom socket communication layer.
 */

'use strict';

import DB from '../db';

class Connector {

    constructor(app) {
        this._app = app;
        this._db = new DB();
    }

    // When the user disconnects, perform this
    onDisconnect(socket) {
        this._db.removeUser(socket);
    }

    // When the user connects, perform this
    onConnect(socket) {
        // Add user to app DB
        this._db.registerUser(socket);

        // When the client emits 'info', this listens and executes
        socket.on('info', data => {
            socket.log(JSON.stringify(data, null, 2));
        });

        // Call onDisconnect.
        socket.on('disconnect', () => {
            this.onDisconnect(socket);
            socket.log('DISCONNECTED');
        });
    }

    /**
     * Configure socket connections.
     *
     * socket.io (v1.x.x) is powered by debug.
     *
     * In order to see all the debug output, set DEBUG
     * (in server/config/local.env.js) to including the desired scope.
     * (don't forget to import config from './environment' ;)
     * ex: DEBUG: "http*,socket.io:socket"
     *
     * We can authenticate socket.io users and access their token through socket.decoded_token
     * 1. You will need to send the token in `client/components/socket/socket.service.js`
     * 2. Require authentication here:
     *      socketio.use(require('socketio-jwt').authorize({
     *          secret: config.secrets.session,
     *          handshake: true
     *      }));
     *
     * @param socketio
     */
    configure(socketio) {

        socketio.on('connection', socket => {

            // Define default functions and attributes
            socket.address = socket.request.connection.remoteAddress +
                ':' + socket.request.connection.remotePort;

            socket.connectedAt = new Date();

            socket.log = function(...data) {
                console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
            };

            // Define default functions and attributes
            this.onConnect(socket);
            socket.log('CONNECTED');
        });
    }

}

export default Connector;
