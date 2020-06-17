/**
 * Main application file.
 */

'use strict';

import express from 'express';
import http from 'http';
import config from './config/environment';
import App from './app/app';

// To link with a database:
// import mongoose from 'mongoose';
// mongoose.Promise = require('bluebird');
// import seedDatabaseIfNeeded from './config/seed';

// Connect to MongoDB
// mongoose.connect(config.mongo.uri, config.mongo.options);
// mongoose.connection.on('error', function(err) {
//    console.error(`MongoDB connection error: ${err}`);
//    process.exit(-1); // eslint-disable-line no-process-exit
// });

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
    server.applicationServer = httpServer.listen(
        config.port,
        config.ip,
        function() {
            console.log('Express server listening on %s :: %d, in %s mode',
                config.ip, config.port, server.get('env'));
        });
}

// seedDatabaseIfNeeded();
setImmediate(startServer);

// Expose app
exports = module.exports = server;
