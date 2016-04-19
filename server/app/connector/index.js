/**
 * Custom socket communication layer.
 */

'use strict';

import DB from '../model/db';

class Connector {

    constructor(app) {
        this._app = app;
        this._db = new DB(this);
        this._io = null;
        this._debug = true;
    }

    get hub() {
        return this._app.hub;
    }

    get io() {
        return this._io;
    }

    // When the user disconnects, perform this
    onDisconnect(socket) {
        var user = socket.user;
        if (user === undefined) return;

        // Leave from any running game
        user.disconnect();
        user.leave();

        this._db.removeUser(user);
    }

    // When the user connects, perform this
    onConnect(socket) {
        // Add user to app DB
        var user = this._db.registerUser(socket);

        // A user knows its socket and reciprocally
        socket.user = user;

        // When the client emits 'info', this listens and executes
        socket.on('info', data => {
            socket.log(JSON.stringify(data, null, 2));
        });

        // Call onDisconnect.
        socket.on('disconnect', () => {
            this.onDisconnect(socket);
            if (this._debug) socket.log('DISCONNECTED');
        });
    }

    setupDebug(socket) {
        this._debug = true;

        socket.address = socket.request.connection.remoteAddress +
            ':' + socket.request.connection.remotePort;

        socket.connectedAt = new Date();

        socket.log = function(...data) {
            console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
        };
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

        this._io = socketio;

        socketio.on('connection', socket => {
            // Define debug functions and attributes
            this.setupDebug(socket);

            // Define default functions and attributes
            this.onConnect(socket);

            if (this._debug) socket.log('CONNECTED');
        });
    }

}

export default Connector;
