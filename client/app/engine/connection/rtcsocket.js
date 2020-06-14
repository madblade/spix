/**
 * WebRTC Socket wrapper for RTC connections.
 */

import extend           from '../../extend.js';

let RTCSocket = function(dataChannel, connection, clientID)
{
    if (!clientID) clientID = 'localhost';
    this.dataChannel = dataChannel;
    this.dataConnection = connection;
    this.name = clientID;
    this.isWebRTC = true;
    this.actions = {};
    this.request = {
        connection: {
            remoteAddress: `host-${clientID}:sandbox`,
            remotePort: 'noport'
        }
    };
    this.nsp = { name: 'nonsp' };
    this.address = `host-${clientID}:sandbox`;
    this.off = function() { console.log('[Socket] Default off function.'); };

    this.dataChannel.onmessage = this.receivedMessage.bind(this);
    this.debugListeners = false;
};

extend(RTCSocket.prototype, {

    connectionEstablished()
    {
        console.log(`RTC Socket "${this.name}" connected.`);
    },

    receivedMessage(e)
    {
        if (e.data.charCodeAt(0) === 2) return;
        let d = JSON.parse(e.data);

        let message = d.m;
        if (!message) {
            console.error('[RTCSocket] Non compliant RTC message.'); return;
        }
        let content = d.c;
        let action = this.actions[message];
        if (!action) {
            console.error(`[RTCSocket] No behavior for "${message}" request.`); return;
        }
        action(content);
    },

    on(message, action)
    {
        this.actions[message] = action;
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
        let m = {m: 'disconnect', c:''};
        this.dataChannel.send(JSON.stringify(m));
    },

    emit(message, data)
    {
        let compact = JSON.stringify({
            m: message,
            c: data
        });
        if (this.dataChannel.readyState === 'open') {
            this.dataChannel.send(compact);
        }
    },

    setDataChannel(newDataChannel)
    {
        this.dataChannel = newDataChannel;
        this.dataChannel.onmessage = this.receivedMessage.bind(this);
    },

    setDataConnection(newConnection)
    {
        this.dataConnection = newConnection;
    },

    closeConnection()
    {
        this.dataChannel.close();
        this.dataConnection.close();
    }

});

export { RTCSocket };
