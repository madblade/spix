/**
 * Serverless WebRTC wrapper offering a SocketIO API.
 * Manual handshake. No IP leak.
 */

'use strict';

import extend           from '../../extend.js';

let RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
let RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;

let WebRTCSocket = function() {
    this.outboundConnection = null;
    this.outboundChannel = null;

    this.currentInboundConnection = null;
    this.currentInboundChannel = null;
    this.inboundConnections = [];
    this.inboundChannels = [];

    // internals
    this.offer = ''; // for server
    this.answer = ''; // for client
    this.sdpConstraints = {
        optional: [],
    };
    this.cfg = { iceServers: {
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun.l.google.com:19302?transport=udp',
        ]
    } };
    this.con = { optional: [{DtlsSrtpKeyAgreement: true}] };
};

extend(WebRTCSocket.prototype, {

    // Create client connection from server offer
    createClientConnection(offer) {
        this.outboundConnection = new RTCPeerConnection(this.cfg, this.con);
        let connection = this.outboundConnection;
        connection.onicecandidate = e => {
            if (e.candidate === null) {
                this.answer = JSON.stringify(pc2.localDescription);
                // TODO update HTML answer creation callback!
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
    addServerSlot() {
        let newConnection = new RTCPeerConnection(this.cfg, this.con);
        this.currentInboundConnection = newConnection;
        newConnection.onicecandidate = e => {
            if (e.candidate === null) {
                this.offer = JSON.stringify(newConnection.localDescription);
                // TODO update HTML offer creation callback!
            }
        };

        let newChannel = newConnection.createDataChannel('test', {reliable: true});
        this.currentInboundChannel = newChannel;
        newChannel.onopen = e => {
            console.log(e); console.log('Connection established.');
            // TODO update HTML server slot
            // TODO update server slot internal with IO methods
            this.inboundChannels.push(this.currentInboundChannel);
            this.inboundConnections.push(this.currentInboundConnection);

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

    acceptInboundConnection(answer) {
        let answerDesc = new RTCSessionDescription(JSON.parse(answer));
        this.currentInboundConnection.setRemoteDescription(answerDesc);
    }

});

export { WebRTCSocket };
