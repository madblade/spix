/**
 * Main application file.
 */

'use strict';

var _setImmediate2 = require('babel-runtime/core-js/set-immediate');

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _environment = require('./config/environment');

var _environment2 = _interopRequireDefault(_environment);

var _app = require('./app/app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Setup server
var server = (0, _express2.default)();
var httpServer = _http2.default.createServer(server);
var socketio = require('socket.io')(httpServer, {
    serveClient: _environment2.default.env !== 'production',
    path: '/socket.io-client'
});
var app = new _app2.default();

app.connect(socketio);
require('./config/express').default(server);
require('./config/routes').default(server);

// Start server
function startServer() {
    server.applicationServer = httpServer.listen(_environment2.default.port, _environment2.default.ip, function () {
        console.log('Express server listening on %d, in %s mode', _environment2.default.port, server.get('env'));
    });
}

(0, _setImmediate3.default)(startServer);

// Expose app
exports = module.exports = server;
//# sourceMappingURL=server.js.map
