/**
 * Wrapper for integrating a full server client-wise.
 * Dummy object when not bundling server.
 */

'use strict';

/// #if BUNDLE
import { default as StandaloneServer } from '../../../server/app/app';
/// #else
StandaloneServer = StandaloneServer || function()
{
    this.connect = function() {};
};
/// #endif

import extend from '../extend';
import { IO } from './io';

let Standalone = function(app)
{
    this.app = app;

    this.io = new IO();
    this.server = new StandaloneServer();
    this._isRunning = false;

    // FF perf fix
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    this.server._setLocal(isFirefox);
};

extend(Standalone.prototype, {

    start()
    {
        console.log('[Standalone] Starting local server.');
        this.server.connect(this.io); // setup IO object
        this.io.connect(this.io.socketServer); // handshake
        this._isRunning = true;
    },

    stop()
    {
        this._isRunning = false;
        console.log('[Standalone] Stopping local server.');
        this.io.disconnect(this.io.socketServer);
    },

    connectUser(userID, socketClient)
    {
        this.server.connectRTC(userID, socketClient);
    },

    // disconnectUser(socketClient)
    // {
    //     this.io.disconnect(socketClient);
    // },

    isRunning()
    {
        return this._isRunning;
    }

});

export { Standalone };
