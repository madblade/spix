/**
 * Serverless WebRTC wrapper offering a SocketIO API.
 * Manual handshake. No IP leak.
 */

'use strict';

import extend           from '../../extend.js';

let RTCPeerConnection =
    window.RTCPeerConnection || window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection;
let RTCSessionDescription =
    window.RTCSessionDescription || window.mozRTCSessionDescription;

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
        optional: [],
    };
    this.cfg = { iceServers:
        [
            { url: 'stun:stun.l.google.com:19302' },
            // { url: 'stun:stun1.l.google.com:19302' },
            // { url: 'stun:stun2.l.google.com:19302' },
            // { url: 'stun:stun.l.google.com:19302?transport=udp' },
        ]
    };
    this.con = { optional: [{DtlsSrtpKeyAgreement: true}] };
};

extend(WebRTCSocket.prototype, {

    // Create client connection from server offer
    createClientConnection(offer, mainMenuState) {
        this.outboundConnection = new RTCPeerConnection(this.cfg, this.con);
        let connection = this.outboundConnection;
        connection.onicecandidate = e => {
            if (e.candidate === null) {
                this.answer = JSON.stringify(connection.localDescription);
                mainMenuState.answerSent(this.answer);
            }
        };

        let offerDesc = new RTCSessionDescription(JSON.parse(offer));
        connection.setRemoteDescription(offerDesc);
        connection.createAnswer(
            answerDesc => connection.setLocalDescription(answerDesc),
            () => {},
            this.sdpConstraints
        );

        connection.ondatachannel = e => {
            let dataChannel = e.channel || e;
            this.outboundChannel = dataChannel;
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
    },

    // Create server slot and offer
    addServerSlot(userID, mainMenuState) {
        let newConnection = new RTCPeerConnection(this.cfg, this.con);
        newConnection.onicecandidate = e => {
            if (e.candidate === null) {
                this.offer = JSON.stringify(newConnection.localDescription);
                console.log('onicecandidate called');
                console.log(this.offer);
                mainMenuState.serverSlotCreated(userID, this.offer, newConnection);
            }
        };

        let newChannel = newConnection.createDataChannel('test', {reliable: true});
        // this.currentInboundChannel = newChannel;
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

        newConnection.createOffer(
            desc => {
                newConnection.setLocalDescription(desc, () => {}, () => {});
            },
            () => {},
            this.sdpConstraints
        );
    },

    acceptInboundConnection(inboundConnection, answer) {
        let answerDesc = new RTCSessionDescription(JSON.parse(answer));
        inboundConnection.setRemoteDescription(answerDesc);
    }

});

export { WebRTCSocket };
