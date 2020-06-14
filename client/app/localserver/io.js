/**
 * local synchronous socketIO emulator
 */

'use strict';

import extend from '../extend';

// Socket internals
let Socket = function()
{
    this.actions = {};
    this.request = {
        connection: {
            remoteAddress: 'localhost:sandbox',
            remotePort: 'noport'
        }
    };
    this.nsp = { name: 'nonsp' };
    this.address = 'localhost:sandbox';
    this.off = function() { console.log('[Socket] Default off function.'); };
    this.otherSocket = {};

    this.debugListeners = false;
};

extend(Socket.prototype, {

    setOtherEndPoint(s)
    {
        this.otherSocket = s;
    },

    // Override
    on(message, action)
    {
        this.actions[message] = action;
        // console.log(`[Socket] added '${message}' listener`);
    },

    removeListener(message)
    {
        let has = this.actions.hasOwnProperty(message);
        if (has) {
            delete this.actions[message];
            if (this.debugListeners)
                console.log(`[Socket] Removed '${message}' listener`);
        }
    },

    // Override
    removeAllListeners(message)
    {
        let has = this.actions.hasOwnProperty(message);
        if (has) {
            delete this.actions[message];
            if (this.debugListeners)
                console.log(`[Socket] Removed '${message}' listener`);
        }
    },

    disconnect()
    {
        let has = this.actions.hasOwnProperty('disconnect');
        if (has) {
            this.actions.disconnect();
        }
    },

    // Override
    emit(message, data)
    {
        // console.log(`emit ${message} with ${data}`);
        // Forward action
        let s = this.otherSocket;
        let has = s.actions.hasOwnProperty(message);
        if (has) {
            s.actions[message](data);
        }
    }
});

// Socket provider
let IO = function()
{
    this.connectionCallback = function() {
        console.log('[IO] No connection behavior specified.');
    };
    this.socketServer = new Socket();
    this.socketClient = new Socket();
    this.socketServer.setOtherEndPoint(this.socketClient);
    this.socketClient.setOtherEndPoint(this.socketServer);
};

extend(IO.prototype, {

    on(message, action)
    {
        if (message === 'connection') {
            this.connectionCallback = action;
        }
    },

    connect(socket)
    {
        this.connectionCallback(socket);
    },

    disconnect(socket)
    {
        if (socket && socket.disconnect)
            socket.disconnect();
        console.log('[IO] Disconnect ');
        this.socketServer.disconnect();
    }

});

// Only expose IO
export { IO };
