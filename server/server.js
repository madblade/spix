/**
 * Main application file.
 */

'use strict';

import express from 'express';
import http from 'http';
import config from './config/environment';
import App from './app';

// Setup server
var server = express();
var httpServer = http.createServer(server);
var socketio = require('socket.io')(httpServer, {
    serveClient: config.env !== 'production',
    path: '/socket.io-client'
});
var app = new App();

app.connect(socketio);
require('./config/express').default(server);
require('./config/routes').default(server);

// Start server
function startServer() {
    server.applicationServer = httpServer.listen(config.port, config.ip, function() {
        console.log('Express server listening on %d, in %s mode', config.port, server.get('env'));
    });
}

setImmediate(startServer);

// Expose app
exports = module.exports = server;
