/**
 * Serverless WebRTC wrapper offering a SocketIO API.
 * Manual handshake. No IP leak.
 */

'use strict';

import extend           from '../../extend.js';
import { RTCSocket } from './rtcsocket';

let RTCPeerConnection = window.RTCPeerConnection;
// || window.mozRTCPeerConnection ||
//     window.webkitRTCPeerConnection;
let RTCSessionDescription = window.RTCSessionDescription;
// || window.mozRTCSessionDescription;

let RTCService = function(app)
{
    this.app = app;

    this.outboundConnection = null;
    this.outboundChannel = null;

    this.inboundConnections = new Map();
    this.inboundChannels = new Map();
    this.sockets = new Map();

    // internals
    this.offer = ''; // for server
    this.answer = ''; // for client
    this.sdpConstraints = {
        optional: [
            {RtpDataChannels: true}
        ],
    };
    this.cfg = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // { urls: 'stun:stun1.l.google.com:19302' },
            // { urls: 'stun:stun2.l.google.com:19302' },
            // { urls: 'stun:stun.l.google.com:19302?transport=udp' },
        ],
        // iceCandidatePoolSize: 10,
    };
    this.con = { optional: [
        // {DtlsSrtpKeyAgreement: true},
        // {RtpDataChannels: true}
    ] };
};

extend(RTCService.prototype, {

    // Create client connection from server offer
    createClientConnection(mainMenuState)
    {
        this.outboundConnection = new RTCPeerConnection(this.cfg);
        let connection = this.outboundConnection;
        let rtc = this;

        connection.ondatachannel = function(e)
        {
            let dataChannel = e.channel;
            let rtcSocket = new RTCSocket(dataChannel, connection);

            dataChannel.onopen = function() { // (m) {
                // Update HTML / Join game
                mainMenuState.notifyServerConnected(rtcSocket);
            };

            // dataChannel.onmessage = function(m) {
            //     let data = JSON.parse(m.data);
            //     console.log(data.message);
            // };

            let probremCallback = function()
            {
                console.log('[RTC] Error or disconnected.');
                // XXX [HUD] notify disconnection on ingame state.
                mainMenuState.notifyServerFailed();
            };
            dataChannel.onclose = probremCallback;
            dataChannel.onclosing = probremCallback;
            dataChannel.onerror = probremCallback;
        };

        connection.onicecandidate = function(e)
        {
            if (e.candidate) return;
            rtc.answer = JSON.stringify(connection.localDescription);
            mainMenuState.answerSent(rtc.answer);
        };

        connection.oniceconnectionstatechange = function()
        {
            console.log(`[RTC] ICE connection state: ${connection.iceConnectionState}`);
            let status = connection.iceConnectionState;
            if (status === 'failed') {
                mainMenuState.notifyRTCError('ice-failed-client');
                mainMenuState.notifyServerFailed();
            } else if (status === 'checking' || status === 'connected') {
                mainMenuState.notifyServerChecking();
            } else if (status === 'disconnected') {
                // XXX [HUD] notify disconnection on ingame state.
                mainMenuState.notifyServerFailed();
            }
        };

        // connection.onsignalingstatechange = function(e) {
        // console.log(e);
        // };
    },

    createClientAnswer(offer)
    {
        let connection = this.outboundConnection;
        let offerDesc = new RTCSessionDescription(JSON.parse(offer));
        connection.setRemoteDescription(offerDesc);
        connection.createAnswer(
            function(answerDesc) { connection.setLocalDescription(answerDesc); },
            function() { console.error('Could not create answer.'); },
            this.sdpConstraints
        );
    },

    // Create server slot and offer
    addServerSlot(userID, mainMenuState, restart)
    {
        let newConnection = new RTCPeerConnection(this.cfg);
        newConnection.onicecandidate = e => {
            if (e.candidate) return;
            this.offer = JSON.stringify(newConnection.localDescription);
            mainMenuState.serverSlotCreated(userID, this.offer, newConnection);
        };
        // newConnection.onsignalingstatechange = function(e) {
        // console.log(e);
        // };
        let rtcService = this;
        newConnection.oniceconnectionstatechange = function()
        {
            console.log(`[RTC] ICE connection state: ${newConnection.iceConnectionState}`);
            let status = newConnection.iceConnectionState;
            if (status === 'failed') {
                mainMenuState.notifyRTCError('ice-failed-server');
                newChannel.close();
                newConnection.close();
                mainMenuState.removeUserSlot(userID);
            } else if (status === 'checking' || status === 'connected') {
                mainMenuState.notifyUserChecking(userID);
            } else if (status === 'disconnected') {
                mainMenuState.notifyUserDisconnected(userID);
                rtcService.disconnectUser(userID);
            }
        };

        let newChannel = newConnection.createDataChannel('chat'
            // , {reliable: true}
        );
        if (restart)
            newConnection.createOffer().then(
                desc => { newConnection.setLocalDescription(desc); }
            );
        else
            newConnection.createOffer().then(
                desc => { newConnection.setLocalDescription(desc); }
            );

        // Cache socket for reconnection
        let rtcSocket = this.sockets.get(userID);
        if (!rtcSocket) {
            rtcSocket = new RTCSocket(newChannel, newConnection, userID);
            this.sockets.set(userID, rtcSocket);
        } else {
            rtcSocket.setDataChannel(newChannel);
            rtcSocket.setDataConnection(newConnection);
        }

        newChannel.onopen = () => {
            mainMenuState.notifyUserConnected(userID, newChannel, newConnection, rtcSocket);
            console.log('[RTCService/Server] RTC connection established.');
            this.inboundChannels.set(userID, newChannel);
            this.inboundConnections.set(userID, newConnection);
        };

        // newChannel.onmessage = e => {
        //     if (e.data.charCodeAt(0) === 2) return; // ?
        //     let data = JSON.parse(e.data);
        //     console.log(data.message);
        // };

        let probremCallback = function()
        {
            console.log('[RTC] Error or disconnected.');
            mainMenuState.notifyUserDisconnected(userID, rtcSocket);
        };
        newChannel.onclose = probremCallback;
        newChannel.onclosing = probremCallback;
        newChannel.onerror = probremCallback;
    },

    acceptInboundConnection(inboundConnection, answer)
    {
        let answerDesc = new RTCSessionDescription(JSON.parse(answer));
        inboundConnection.setRemoteDescription(answerDesc);
    },

    disconnectUser(userID)
    {
        let channel = this.inboundChannels.get(userID);
        let connection = this.inboundConnections.get(userID);
        if (channel) {
            channel.close();
            connection.close();
        }
        this.inboundChannels.delete(userID);
        this.inboundConnections.delete(userID);
    }

});

export { RTCService };
