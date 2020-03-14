/**
 * Wrapper for integrating a full server client-wise.
 */

'use strict';

/// #if BUNDLE
import { default as StandaloneServer } from '../../../server/app/app';
/// #else
StandaloneServer = StandaloneServer || function() {
    this.connect = function() {};
};
/// #endif

import extend from '../extend';
import { IO } from './io';

let Standalone = function(app) {
    this.app = app;

    this.io = new IO();
    this.server = new StandaloneServer();
};

extend(Standalone.prototype, {

    start() {
        console.log('[Standalone] Starting local server.');
        this.server.connect(this.io); // setup IO object
        this.io.connect(); // handshake
        // this.io.socketClient.emit('connection');
        // this.io.socketServer.emit('connected');
    },

    stop() {
        console.log('[Standalone] Stopping local server.');
        this.io.disconnect();
    }

});

export { Standalone };
