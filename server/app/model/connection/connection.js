/**
 * Custom socket communication layer.
 */

'use strict';

import Factory from '../factory';

class Connector
{
    constructor(app) {
        this._app = app;
        this._userDB = Factory.createUserDB(this);
        this._io = null;
        this._debug = false;
        this._sandboxConnections = new Set();
    }

    // Model
    get hub() { return this._app.hub; }
    get io() { return this._io; }
    get db() { return this._userDB; }

    // When the user connects, register him
    setupUser(socket) {
        // Add user to app DB
        let user = this._userDB.registerUser(socket);

        // A user knows its socket and reciprocally
        socket.user = user;

        // Inform the user that its connection is established
        // Make him wait a little... Server does not hurry.
        this.confirmUserConnection(socket);
    }

    confirmUserConnection(socket) {
        setTimeout(() => socket.emit('connected', ''), 50);
    }

    setupDisconnect(socket) {
        // Setup off util function
        socket.off = socket.removeListener;

        // Call onDisconnect.
        socket.on('disconnect', () => {
            let user = socket.user;
            if (user === undefined) return;

            // Leave from any running game.
            user.leave(); // First disconnects then makes the game forget.

            // Destroy user.
            this._userDB.removeUser(user);

            if (this._debug) socket.log('DISCONNECTED');

            if (socket.isWebRTC) {
                socket.closeConnection();
            }
        });
    }

    setupDebug(socket) {
        this._debug = true;

        socket.address =
            `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`;

        socket.connectedAt = new Date();

        socket.log = function(...data) {
            console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
        };

        // When the client emits 'info', this listens and executes
        socket.on('info', data => {
            socket.log(JSON.stringify(data, null, 2));
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
        if (this._io) {
            console.log('[Server/Connector] Trying to configure a running app, ' +
                'using the last configuration!');
            return;
        }
        console.log('configuration socketIO.......');

        this._io = socketio;

        socketio.on('connection', socket => {
            this.configureFromSocket(socket);
        });
    }

    configureFromSocket(socket, userID) {
        if (userID) {
            let hasUser = this._sandboxConnections.has(userID);
            if (hasUser) {
                // Find user with the connection id.
                let users = this._userDB.getUsers();
                let userReplace = null;
                users.forEach(user => {
                    // replace user socket
                    if (user.connection.socket.name === userID) {
                        userReplace = user;
                    }
                });
                if (userReplace) {
                    console.log('CLEANUP OLD SOCKET');
                    // CAUTION! Setter handles cleanup.
                    userReplace.connection.socket = socket;
                    if (userReplace.player) {
                        let playerCo = userReplace.player.connection;
                        // CAUTION! Setter handles cleanup here too.
                        playerCo.socket = socket;
                    }
                    this.confirmUserConnection(socket);
                    return;
                }
            }
            else this._sandboxConnections.add(userID);
        }

        // Define debug functions and attributes
        this.setupDebug(socket);

        // Define disconnect behaviour
        this.setupDisconnect(socket);

        // Register user
        this.setupUser(socket);

        if (this._debug) socket.log('CONNECTED');
    }
}

export default Connector;
