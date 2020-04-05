/**
 * Serverless WebRTC wrapper offering a SocketIO API.
 * Manual handshake. No IP leak.
 */

'use strict';

import extend           from '../../extend.js';

let RTCPeerConnection = window.RTCPeerConnection;
// || window.mozRTCPeerConnection ||
//     window.webkitRTCPeerConnection;
let RTCSessionDescription = window.RTCSessionDescription;
// || window.mozRTCSessionDescription;

let WebRTCSocket = function(app) {
    this.app = app;

    this.outboundConnection = null;
    this.outboundChannel = null;

    this.inboundConnections = new Map();
    this.inboundChannels = new Map();

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

extend(WebRTCSocket.prototype, {

    // Create client connection from server offer
    createClientConnection(mainMenuState) {
        this.outboundConnection = new RTCPeerConnection(this.cfg);
        let connection = this.outboundConnection;
        let rtc = this;

        connection.ondatachannel = function(e) {
            // TODO setup communication in server part
            let dataChannel = e.channel;
            // this.outboundChannel = dataChannel;
            dataChannel.onopen = function(m) {
                // Update HTML / Join game
                mainMenuState.notifyServerConnected();
                console.log('CHANNEL OPEN CLIENT');
                console.log(m);
                dataChannel.send(JSON.stringify({message: 'General Kenobi'}));
            };

            dataChannel.onmessage = function(m) {
                let data = JSON.parse(m.data);
                console.log(data.message);
            };
        };

        connection.onicecandidate = function(e) {
            if (e.candidate) return;
            rtc.answer = JSON.stringify(connection.localDescription);
            mainMenuState.answerSent(rtc.answer);
        };

        connection.oniceconnectionstatechange = function() {
            console.log(`[RTC] ICE connection state: ${connection.iceConnectionState}`);
            let status = connection.iceConnectionState;
            if (status === 'failed') {
                mainMenuState.notifyRTCError('ice-failed-client');
                mainMenuState.notifyServerFailed();
            } else if (status === 'checking' || status === 'connected') {
                mainMenuState.notifyServerChecking();
            }
        };

        // connection.onsignalingstatechange = function(e) {
        // console.log(e);
        // };
    },

    createClientAnswer(offer) {
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
    addServerSlot(userID, mainMenuState) {
        let newConnection = new RTCPeerConnection(this.cfg);
        newConnection.onicecandidate = e => {
            if (e.candidate) return;
            this.offer = JSON.stringify(newConnection.localDescription);
            mainMenuState.serverSlotCreated(userID, this.offer, newConnection);
        };
        // newConnection.onsignalingstatechange = function(e) {
        // console.log(e);
        // };
        newConnection.oniceconnectionstatechange = function() {
            console.log(`[RTC] ICE connection state: ${newConnection.iceConnectionState}`);
            let status = newConnection.iceConnectionState;
            if (status === 'failed') {
                mainMenuState.notifyRTCError('ice-failed-server');
                newChannel.close();
                newConnection.close();
                mainMenuState.removeUserSlot(userID);
            } else if (status === 'checking' || status === 'connected') {
                mainMenuState.notifyUserChecking(userID);
            }
        };

        let newChannel = newConnection.createDataChannel('chat'
            // , {reliable: true}
        );
        newConnection.createOffer().then(
            desc => {
                newConnection.setLocalDescription(desc);
            }
        );

        // TODO update server slot internal with IO methods
        // TODO setup communication in the socket part
        newChannel.onopen = e => {
            mainMenuState.notifyUserConnected(userID);
            console.log('CHANNEL OPEN SERVER');
            console.log(e); console.log('Channel onopen called, RTC connection established.');
            this.inboundChannels.set(userID, newChannel);
            this.inboundConnections.set(userID, newConnection);
            newChannel.send(JSON.stringify({message: 'hello there'}));
        };

        newChannel.onmessage = e => {
            if (e.data.charCodeAt(0) === 2) return; // ?
            let data = JSON.parse(e.data);
            console.log(data.message);
        };
    },

    acceptInboundConnection(inboundConnection, answer) {
        let answerDesc = new RTCSessionDescription(JSON.parse(answer));
        inboundConnection.setRemoteDescription(answerDesc);
    }

});

export { WebRTCSocket };
