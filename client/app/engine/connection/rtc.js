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
        this.outboundConnection = new RTCPeerConnection(null);
        let connection = this.outboundConnection;
        let rtc = this;

        connection.ondatachannel = function(e) {
            let dataChannel = e.channel;
            // this.outboundChannel = dataChannel;
            dataChannel.onopen = function(m) {
                console.log('CHANNEL OPEN CLIENT');
                console.log(m);
                // TODO update HTML client and join game

                // TODO setup communication in server part
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
            if (connection.iceConnectionState === 'failed') {
                mainMenuState.notifyRTCError('ice-failed-client');
                // TODO HTML cleanup
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
            { optional: [{RtpDataChannels: true}]  }
        );
    },

    // Create server slot and offer
    addServerSlot(userID, mainMenuState) {
        let newConnection = new RTCPeerConnection(null);
        newConnection.onicecandidate = e => {
            if (e.candidate) return;
            this.offer = JSON.stringify(newConnection.localDescription);
            console.log('onicecandidate called');
            console.log(this.offer);
            mainMenuState.serverSlotCreated(userID, this.offer, newConnection);
        };
        // newConnection.onsignalingstatechange = function(e) {
        // console.log(e);
        // };
        newConnection.oniceconnectionstatechange = function() {
            console.log(`[RTC] ICE connection state: ${newConnection.iceConnectionState}`);
            if (newConnection.iceConnectionState === 'failed') {
                mainMenuState.notifyRTCError('ice-failed-server');
                // TODO HTML cleanup
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
        newChannel.onopen = e => {
            console.log('CHANNEL OPEN SERVER');
            console.log(e); console.log('Channel onopen called, RTC connection established.');
            // TODO update HTML server slot
            // TODO update server slot internal with IO methods
            this.inboundChannels.set(userID, newChannel);
            this.inboundConnections.set(userID, newConnection);

            // TODO setup communication in the socket part
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
